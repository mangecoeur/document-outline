'use babel';

import MarkdownModel from './markdown-model';
import LatexModel from './latex-model';
import ReStructuredTextModel from './rst-model';

import DocumentOutlineView from './document-outline-view';
// import DocumentOutlineView from './mock-view';
import {CompositeDisposable} from 'atom';
import {scopeIncludesOne} from './util';

let DocModelsForEditors = new WeakMap();
let SubscriptionsForEditors = new WeakMap();

const supportedScopes = ['source.gfm', 'text.md', 'text.tex.latex', 'text.tex.latex.beamer', 'text.restructuredtext'];
const modelClassForScopes = {
  'source.gfm': MarkdownModel,
  'text.md': MarkdownModel,
  'text.tex.latex': LatexModel,
  'text.tex.latex.beamer': LatexModel,
  'text.knitr': LatexModel,
  'text.restructuredtext': ReStructuredTextModel
};

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
    atom.config.observe("document-outline.showByDefault", enable => {
      this.active = enable;
      this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
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

    this.subscriptions.add(atom.workspace.observeActivePaneItem(pane => {
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
    if (editor.getRootScopeDescriptor) {
      let scopeDescriptor = editor.getRootScopeDescriptor();
      // let scopeList = atom.config.get('document-outline.supportedScopes');
      // include support for both source.gfm default scope and language-markdown text.md scope
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
      let docModel = this.getDocumentModel(this.editor);
      // TODO also save view? want a way to save view settings e.g. width
      this.view = new DocumentOutlineView(this.editor, docModel);

      let editorSubscriptions = SubscriptionsForEditors.get(this.editor);
      if (!editorSubscriptions) {
        editorSubscriptions = new CompositeDisposable();
        editorSubscriptions.add(this.editor.onDidStopChanging(() => docModel.update()));
        // editorSubscriptions.add(this.editor.onDidSave(() => docModel.update()));

        editorSubscriptions.add(docModel.onDidUpdate(newTree => {
          this.view.updateDocTree(newTree);
          this.view.highlightSectionAtCursor();
        }));
        SubscriptionsForEditors.set(this.editor, editorSubscriptions);
      }
    }
  },

  toggle() {
    // Fixme: need to clear all! not just active...
    if (this.active === true) {
      this.active = false;
      this.clear();
      // TODO should probably iterate over open editors, check for grammar, and dispose listeners
      // not sure if dropping weakref will nuke things automatically...
      let editorSubscriptions = SubscriptionsForEditors.get(this.editor);
      if (editorSubscriptions) editorSubscriptions.dispose();
      DocModelsForEditors = new WeakMap();
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
    }
  },

  deactivate() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
    DocModelsForEditors = new WeakMap();
    SubscriptionsForEditors = new WeakMap();
    this.subscriptions.dispose();
  },

  getDocumentModel(editor) {
    let docModel = DocModelsForEditors.get(this.editor);

    if (!docModel) {
      let scope = scopeIncludesOne(editor.getRootScopeDescriptor().scopes, supportedScopes);
      let ModelClass = modelClassForScopes[scope];
      docModel = new ModelClass(this.editor);
      DocModelsForEditors.set(this.editor, docModel);
    }
    return docModel;
  },

  getDocumentView(editor) {
    let docModel = DocModelsForEditors.get(this.editor);

    if (!docModel) {
      let scope = scopeIncludesOne(editor.getRootScopeDescriptor().scopes, supportedScopes);
      let ModelClass = modelClassForScopes[scope];
      docModel = new ModelClass(this.editor);
      DocModelsForEditors.set(this.editor, docModel);
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
