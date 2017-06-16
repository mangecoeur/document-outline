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

// TODO don't show the outline until switch to the first text editor.
// TODO add autohide option to close when switch away

export default {
  config: {
    showByDefault: {
      type: 'boolean',
      default: true,
      description: 'Automatically show when opening a supported document type'
    },
    autoHide: {
      type: 'boolean',
      default: false,
      description: 'Auto hide the outline pane when switching tabs'
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
    this.updateView.bind(this);

    atom.contextMenu.add({'div.document-outline': [{
      label: 'Toggle outline',
      command: 'document-outline:toggle'
    }]});

    // View and document model for the active pane
    // this.
    this.active = false;
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
      if (enable && !this.active) {
        atom.workspace.open(this.view);
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

    this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
  },

  updateCurrentEditor(editor) {
    if (!editor) {
      return;
    }

    // Only text panes have scope descriptors
    // Note that we don't clear if the current pane is not a text editor,
    // because the docks count as panes, so focusing a dock would clear
    // the outline
    if (editor.getRootScopeDescriptor) {
      let scopeDescriptor = editor.getRootScopeDescriptor();
      if (scopeIncludesOne(scopeDescriptor.scopes, supportedScopes)) {
        this.editor = editor;
        this.docModel = this.getDocumentModel(editor);
        this.editorSubscriptions.dispose();

        atom.workspace.open(this.view);

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
          if (atom.config.get('document-outline.autoHide')) {
            atom.workspace.hide(this.view);
          }
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

    let scope = scopeIncludesOne(editor.getRootScopeDescriptor().scopes, supportedScopes);
    let ModelClass = modelClassForScopes[scope];
    if (ModelClass) {
      docModel = new ModelClass(editor);
    }

    return docModel;
  }
};
