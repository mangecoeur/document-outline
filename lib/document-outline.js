// 'use babel';

const {MarkdownModel} = require('./markdown-model');
const {LatexModel} = require('./latex-model');
const {ReStructuredTextModel} = require('./rst-model');
const {AsciiDocModel} = require('./asciidoc-model');

const {DocumentOutlineView} = require('./document-outline-view');
const {CompositeDisposable} = require('atom');
const {scopeIncludesOne} = require('./util');

const MODEL_CLASS_FOR_SCOPES = {
  'source.gfm': MarkdownModel,
  'text.html.markdown.source.gfm.apib': MarkdownModel,
  'text.md': MarkdownModel,
  'source.pweave.md': MarkdownModel,
  'source.weave.md': MarkdownModel,
  'text.tex.latex': LatexModel,
  'text.tex.latex.beamer': LatexModel,
  'text.tex.latex.knitr': LatexModel,
  'text.knitr': LatexModel,
  'text.restructuredtext': ReStructuredTextModel,
  'source.asciidoc': AsciiDocModel
};

const SUPPORTED_SCOPES = Object.keys(MODEL_CLASS_FOR_SCOPES);

module.exports = {
  config: {
    showByDefault: {
      type: 'boolean',
      default: true,
      description: 'Automatically show outline when opening a supported document type'
    },
    collapseByDefault: {
      type: 'boolean',
      default: false,
      description: 'Automatically collapse outline, expanding only the current section'
    },
    maxHeadingDepth: {
      type: 'integer',
      default: 4,
      minimum: 1,
      maximum: 7
    },
    autoScrollOutline: {
      type: 'boolean',
      default: true,
      description: 'Auto scroll the outline view to the section at the cursor'
    },
    highlightCurrentSection: {
      type: 'boolean',
      default: true,
      description: 'Highlight and scroll to the currently edited section in the outline'
    },
    defaultSide: {
      type: 'string',
      default: 'right',
      enum: [{value: 'left', description: 'Left'}, {value: 'right', description: 'Right'}],
      description: 'Default side for outline to appear'
    }
  },

  activate() {
    this.update.bind(this);

    atom.contextMenu.add({'div.document-outline': [{
      label: 'Toggle outline',
      command: 'document-outline:toggle'
    }]});

    // View and document model for the active pane
    this.docModel = null;
    this.view = new DocumentOutlineView();
    this.subscriptions = new CompositeDisposable();
    // subscriptions for the currently active editor, cleared on tab switch
    this.editorSubscriptions = new CompositeDisposable();

    // atom.workspace.addOpener(uri => {
    //   if (uri === 'atom://document-outline/outline') {
    //     return new DocumentOutlineView();
    //   }
    // });

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'document-outline:toggle': () => {
        atom.workspace.toggle(this.view);
      }
    }));

    this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem(pane => {
      this.updateCurrentEditor(pane);
    }));

    // Update the view if any options change
    this.subscriptions.add(atom.config.observe('document-outline.maxHeadingDepth', newValue => {
      this.update(atom.workspace.getActiveTextEditor());
    }));

    this.subscriptions.add(atom.config.observe('document-outline.autoScrollOutline', () => {
      this.update(atom.workspace.getActiveTextEditor());
    }));

    this.subscriptions.add(atom.config.observe('document-outline.highlightCurrentSection', () => {
      this.update(atom.workspace.getActiveTextEditor());
    }));

    this.subscriptions.add(atom.config.observe('document-outline.collapseByDefault', () => {
      this.update(atom.workspace.getActiveTextEditor());
    }));

    this.subscriptions.add(atom.config.observe('document-outline.defaultSide', () => {
      if (atom.config.get("document-outline.showByDefault")) {
        atom.workspace.hide(this.view);
        atom.workspace.open(this.view, {location: atom.config.get('document-outline.defaultSide')});
      }
    }));

    this.subscriptions.add(atom.config.observe("document-outline.showByDefault", enable => {
      if (enable) {
        this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
        atom.workspace.open(this.view, {location: atom.config.get('document-outline.defaultSide')});
      } else {
        this.view.clear();
        // atom.workspace.hide(this.view);
      }
    }));

    if (atom.config.get("document-outline.showByDefault")) {
      this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
      atom.workspace.open(this.view, {location: atom.config.get('document-outline.defaultSide')});
    }
    //  else {
    //   atom.workspace.hide(this.view);
    // }
  },

  updateCurrentEditor(editor) {
    if (!editor) {
      return;
    }

    // Only text panes have scope descriptors
    // Note that we don't clear if the current pane is not a text editor,
    // because the docks count as panes, so focusing a dock would clear
    // the outline
    if (atom.workspace.isTextEditor(editor)) {
      let scopeDescriptor = editor.getRootScopeDescriptor();
      if (scopeIncludesOne(scopeDescriptor.scopes, SUPPORTED_SCOPES)) {
        this.editor = editor;
        this.docModel = this.getDocumentModel(editor);
        this.editorSubscriptions.dispose();

        this.editorSubscriptions.add(editor.onDidStopChanging(() => {
          // TODO add throttle here
          this.update(editor);
        }));
        this.update(editor);
      } else {
        // this is an editor, but not a supported language
        this.docModel = null;
        if (this.view) {
          this.view.clear();
          this.editorSubscriptions.dispose();
          // if (!atom.config.get("document-outline.showByDefault")) {
          //   atom.workspace.hide(this.view);
          // }
        }
      }
    }
  },

  update(editor) {
    if (this.view) {
      if (this.docModel) {
        let outline = this.docModel.getOutline();
        if (outline) {
          this.view.update({outline, editor});
        }
      } else {
        this.view.clear();
      }
    }
  },

  deactivate() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
      this.docModel = null;
    }
    this.editorSubscriptions.dispose();
    this.subscriptions.dispose();
  },

  getDocumentModel(editor) {
    let docModel = null;

    let scope = scopeIncludesOne(editor.getRootScopeDescriptor().scopes, SUPPORTED_SCOPES);
    let ModelClass = MODEL_CLASS_FOR_SCOPES[scope];
    if (ModelClass) {
      docModel = new ModelClass(editor);
    }

    return docModel;
  },

  provideOutlines() {
    // type outlineprovider
    return {
      name: 'Document outline',
      // priority: number,
      grammarScopes: SUPPORTED_SCOPES,
      getOutline: editor => {
        let docModel = this.getDocumentModel(editor);
        return {outlineTrees: docModel.getOutline()};
      }
    };
  }
};
