'use babel';

import MarkdownModel from './markdown-model';
import LatexModel from './latex-model';
import ReStructuredTextModel from './rst-model';
import AsciiDocModel from './asciidoc-model';

import DocumentOutlineView from './document-outline-view';
import {CompositeDisposable} from 'atom';
import {scopeIncludesOne} from './util';

const MODEL_CLASS_FOR_SCOPES = {
  'source.gfm': MarkdownModel,
  'text.md': MarkdownModel,
  'text.tex.latex': LatexModel,
  'text.tex.latex.beamer': LatexModel,
  'text.tex.latex.knitr': LatexModel,
  'text.knitr': LatexModel,
  'text.restructuredtext': ReStructuredTextModel,
  'source.asciidoc': AsciiDocModel
};

const SUPPORTED_SCOPES = Object.keys(MODEL_CLASS_FOR_SCOPES);

export default {
  config: {
    showByDefault: {
      type: 'boolean',
      default: true,
      description: 'Automatically show outline when opening a supported document type'
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
  subscriptions: null,
  activate() {
    this.updateView.bind(this);

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

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'document-outline:toggle': () => {
        atom.workspace.toggle(this.view);
      }
    }));

    this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem(pane => {
      this.updateCurrentEditor(pane);
    }));

    atom.config.observe("document-outline.showByDefault", enable => {
      this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
      if (enable) {
        atom.workspace.open(this.view, {location: atom.config.get('document-outline.defaultSide')});
      }
    });

    // Update the view if any options change
    atom.config.observe('document-outline.maxHeadingDepth', newValue => {
      this.updateView(atom.workspace.getActiveTextEditor());
    });

    atom.config.observe('document-outline.autoScrollOutline', () => {
      this.updateView(atom.workspace.getActiveTextEditor());
    });

    atom.config.observe('document-outline.highlightCurrentSection', () => {
      this.updateView(atom.workspace.getActiveTextEditor());
    });

    atom.config.observe('document-outline.defaultSide', () => {
      atom.workspace.hide(this.view);
      atom.workspace.open(this.view, {location: atom.config.get('document-outline.defaultSide')});
    });

    this.updateCurrentEditor(atom.workspace.getActiveTextEditor());

    if (atom.config.get("document-outline.showByDefault")) {
      atom.workspace.open(this.view, {location: atom.config.get('document-outline.defaultSide')});
    }
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
          this.updateView(editor);
        }));
        this.updateView(editor);
      } else {
        // this is an editor, but not a supported language
        this.docModel = null;
        if (this.view) {
          this.view.clear();
          this.editorSubscriptions.dispose();
        }
      }
    }
  },

  updateView(editor) {
    if (this.view) {
      if (this.docModel) {
        let headingUpdates = this.docModel.getUpdate();
        if (headingUpdates) {
          this.view.setModel(headingUpdates, editor);
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
  }
};
