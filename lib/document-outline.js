'use babel';

import MarkdownModel from './markdown-model';
import LatexModel from './latex-model';
import ReStructuredTextModel from './rst-model';
import AsciiDocModel from './asciidoc-model';

import DocumentOutlineView from './document-outline-view';
import {CompositeDisposable} from 'atom';
import {scopeIncludesOne} from './util';

let SubscriptionsForEditors = new WeakMap();

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

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'document-outline:toggle': () => {
        this.toggle();
      }
    }));

    atom.contextMenu.add({'div.document-outline': [{
      label: 'Toggle outline',
      command: 'document-outline:toggle'
    }]});

    this.subscriptions.add(atom.workspace.onDidStopChangingActivePaneItem(pane => {
      this.updateCurrentEditor(pane);
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
        this.show();
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

  show() {
    if (!this.view) {
      // Set the view and docModel, update them when text changes
      this.view = new DocumentOutlineView(this.editor);
      this.editorSubscriptions = new CompositeDisposable();
      this.editorSubscriptions.add(this.editor.onDidStopChanging(() => {
        this.updateView();
      }));
      atom.workspace.open(this.view);
    }
    this.updateView();
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

  toggle() {
    // Toggle the add-on
    if (this.active === true) {
      this.off();
    } else {
      this.on();
    }
  },

  on() {
    let editor = atom.workspace.getActiveTextEditor();
    this.active = true;
    this.updateCurrentEditor(editor);
  },

  off() {
    this.active = false;
    if (this.view) {
      this.view.clear();
    }
    this.view = null;
    this.docModel = null;
    for (let editor of atom.textEditors.editors) {
      let editorSubscriptions = SubscriptionsForEditors.get(editor);
      if (editorSubscriptions) editorSubscriptions.dispose();
    }
    SubscriptionsForEditors = new WeakMap();
  },

  deactivate() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
      this.docModel = null;
    }
    SubscriptionsForEditors = new WeakMap();
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
  },

  getSubscriptions(editor) {
    let subscriptions = SubscriptionsForEditors.get(editor);

    if (!subscriptions) {
      subscriptions = new CompositeDisposable();
      SubscriptionsForEditors.set(editor, subscriptions);
    }
    return subscriptions;
  }

};
