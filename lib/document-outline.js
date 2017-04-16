'use babel';

import MarkdownModel from './markdown-model';
import LatexModel from './latex-model';
import ReStructuredTextModel from './rst-model';
import AsciiDocModel from './asciidoc-model';

import DocumentOutlineView from './document-outline-view';
// import DocumentOutlineView from './mock-view';
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

// TODO: Decide whether highlight should follow scrolling or cursor position

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
    }
    // TODO could add scope config by adding list of scopes for each implemented model
    // supportedScopes: {
    //   type: 'array',
    //   default: ['source.gfm', 'text.md'],
    //   items: {
    //     type: 'string'
    //   },
    //   description: 'List of scopes supported by document-outline. No guarantee that non-default scopes will work.'
    // }
  },
  subscriptions: null,
  activate() {
    this.subscriptions = new CompositeDisposable();
    // View and document model for the active pane
    this.view = null;
    this.docModel = null;

    atom.config.observe("document-outline.showByDefault", enable => {
      this.active = enable;
      this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
    });

    atom.config.observe('document-outline.maxHeadingDepth', newValue => {
      if (newValue && this.docModel) {
        this.docModel.maxDepth = newValue;
        this.updateView();
      }
    });

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'document-outline:toggle': () => {
        this.toggle();
        this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
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
      this.clear();
      return;
    }

    let rightscope = false;
    // Only text panes have scope descriptors
    if (editor.getRootScopeDescriptor) {
      let scopeDescriptor = editor.getRootScopeDescriptor();
      // let scopeList = atom.config.get('document-outline.supportedScopes');
      rightscope = scopeDescriptor && (scopeIncludesOne(scopeDescriptor.scopes, supportedScopes));
    }

    if (rightscope) {
      this.editor = editor;
      this.clear();
      this.show();
    } else {
      this.clear();
    }
  },

  show() {
    if (this.view) {
      this.view.show();
    } else {
      // Set the view and docModel, update them when text changes
      this.docModel = this.getDocumentModel(this.editor);
      this.view = new DocumentOutlineView(this.editor, this.docModel.parse());

      let editorSubscriptions = SubscriptionsForEditors.get(this.editor);
      if (!editorSubscriptions) {
        editorSubscriptions = new CompositeDisposable();
        editorSubscriptions.add(this.editor.onDidStopChanging(() => {
          this.updateView();
        }
        ));
        // editorSubscriptions.add(this.editor.onDidSave(() => docModel.update()));
        SubscriptionsForEditors.set(this.editor, editorSubscriptions);
      }
    }
  },

  updateView() {
    this.view.setModel(this.docModel.parse());
    this.view.highlightSectionAtCursor();
  },

  toggle() {
    if (this.active === true) {
      this.active = false;
      this.clear();
      // TODO should probably iterate over open editors, check for grammar, and dispose listeners
      // not sure if dropping weakref will nuke things automatically...
      let editorSubscriptions = SubscriptionsForEditors.get(this.editor);
      if (editorSubscriptions) editorSubscriptions.dispose();
      SubscriptionsForEditors = new WeakMap();
    } else {
      this.active = true;
      this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
    }
  },

  clear() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
      this.docModel = null;
    }
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
      docModel = new ModelClass(this.editor);
    }

    return docModel;
  },

  getSubscriptions(editor) {
    let subscriptions = SubscriptionsForEditors.get(this.editor);

    if (!subscriptions) {
      subscriptions = new CompositeDisposable();
      SubscriptionsForEditors.set(this.editor, subscriptions);
    }
    return subscriptions;
  }

};
