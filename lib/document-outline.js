'use babel';

import MarkdownModel from './markdown-model';
import LatexModel from './latex-model';
import ReStructuredTextModel from './rst-model';
import AsciiDocModel from './asciidoc-model';

import DocumentOutlineView from './document-outline-view';
import {CompositeDisposable} from 'atom';
import {scopeIncludesOne} from './util';

const modelClassForScopes = {
  'source.gfm': MarkdownModel,
  'text.md': MarkdownModel,
  'text.tex.latex': LatexModel,
  'text.tex.latex.beamer': LatexModel,
  'text.tex.latex.knitr': LatexModel,
  'text.knitr': LatexModel,
  'text.restructuredtext': ReStructuredTextModel,
  'source.asciidoc': AsciiDocModel
};

const supportedScopes = Object.keys(modelClassForScopes);

// TODO need to clean up the view when the dock item is closed, and set the active flag, so that when you toggle it back on it comes back as you expect (currently needs to be toggleed twice)

export default {
  config: {
    showByDefault: {
      type: 'boolean',
      default: false,
      description: 'Always show when opening a supported document type'
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
    }
  },
  subscriptions: null,
  activate() {
    this.subscriptions = new CompositeDisposable();
    // View and document model for the active pane
    this.view = null;
    this.docModel = null;

    this.updateView.bind(this);

    // Update the view if any options change
    atom.config.observe("document-outline.showByDefault", enable => {
      this.active = enable;
      this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
    });

    atom.config.observe('document-outline.maxHeadingDepth', newValue => {
      this.updateView();
    });

    atom.config.observe('document-outline.autoScrollOutline', () => {
      this.updateView();
    });

    atom.config.observe('document-outline.highlightCurrentSection', () => {
      this.updateView();
    });

    atom.contextMenu.add({'div.document-outline': [{
      label: 'Toggle outline',
      command: 'document-outline:toggle'
    }]});

    this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem(pane => {
      this.updateCurrentEditor(pane);
    }));

    // Set the view and docModel, update them when text changes
    this.view = new DocumentOutlineView();
    this.editorSubscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'document-outline:toggle': () => {
        atom.workspace.toggle(this.view);
      }
    }));

    this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
  },

  updateCurrentEditor(editor) {
    if (!editor) {
      return;
    }

    if (!this.active) {
      this.off();
      return;
    }

    // Only text panes have scope descriptors
    // But, esp with docks, pane item might be in active but not the desired target
    // so only clear if the pane is a text editor but wrong scope
    if (editor.getRootScopeDescriptor) {
      let scopeDescriptor = editor.getRootScopeDescriptor();
      if (scopeIncludesOne(scopeDescriptor.scopes, supportedScopes)) {
        this.editor = editor;
        this.docModel = this.getDocumentModel(editor);
        atom.workspace.open(this.view);
        this.editorSubscriptions.dispose();
        this.editorSubscriptions.add(editor.onDidStopChanging(() => {
          this.updateView();
        }));
        this.updateView();
      } else {
        // this is an editor, but not a supported language
        this.docModel = null;
        if (this.view) {
          // clear the view if previously created
          this.view.clear();
          // dispose of view subscriptions
          this.editorSubscriptions.dispose();
        }
      }
    }
  },

  updateView() {
    if (this.view) {
      if (this.docModel) {
        let headingUpdates = this.docModel.getUpdate();
        if (headingUpdates) {
          this.view.setModel(headingUpdates, this.editor);
        }
      } else {
        this.view.clear();
      }
    }
  },

  // on() {
  //   let editor = atom.workspace.getActiveTextEditor();
  //   this.active = true;
  //   this.updateCurrentEditor(editor);
  // },
  //
  // off() {
  //   this.active = false;
  //   if (this.view) {
  //     this.view.clear();
  //   }
  //   this.view = null;
  //   this.docModel = null;
  // },

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

    let scope = scopeIncludesOne(editor.getRootScopeDescriptor().scopes, supportedScopes);
    let ModelClass = modelClassForScopes[scope];
    if (ModelClass) {
      docModel = new ModelClass(editor);
    }

    return docModel;
  }
};
