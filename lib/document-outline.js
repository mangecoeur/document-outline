'use babel';

import MarkdownModel from './markdown-model';
import DocumentOutlineView from './document-outline-view';
// import DocumentOutlineView from './mock-view';
import {CompositeDisposable} from 'atom';

let MarkdownModelsForEditors = new WeakMap();
let SubscriptionsForEditors = new WeakMap();

// TODO: Decide whether highlight should follow scrolling or cursor position

export default {
  config: {
    showByDefault: {
      type: 'boolean',
      default: false
    },
    maxHeadingDepth: {
      type: 'integer',
      default: 3,
      minimum: 1,
      maximum: 6
    }
  },
  subscriptions: null,
  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
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
      // include support for both source.gfm default scope and language-markdown text.md scope
      rightscope = scopeDescriptor && (scopeDescriptor.scopes.includes('source.gfm') || scopeDescriptor.scopes.includes('text.md'));
    }

    if (rightscope) {
      this.editor = editor;
      this.clear();
      this.show();
    } else {
      this.hide();
    }
  },

  show() {
    if (this.view) {
      this.view.show();
    } else {
      let docModel = this.getDocumentModel(this.editor);

      this.view = new DocumentOutlineView(this.editor, docModel);

      let subscriptions = SubscriptionsForEditors.get(this.editor);
      if (!subscriptions) {
        subscriptions = new CompositeDisposable();
        // subscriptions.add(this.editor.onDidStopChanging(() => docModel.update()));
        // subscriptions.add(this.editor.onDidChangeCursorPosition(() => this.view.update()));
        subscriptions.add(this.editor.onDidSave(() => docModel.update()));
        SubscriptionsForEditors.set(this.editor, subscriptions);
      }

      // docModel.onDidUpdate(newTree => {
      //   if (this.view) {
      //     this.view.tree = newTree;
      //   } else {
      //     MarkdownModelsForEditors.delete(this.editor);
      //   }
      // });
    }
  },

  toggle() {
    if (this.active === true) {
      this.active = false;
      this.hide();
      this.view = null;
    } else {
      this.active = true;
      this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
      // this.show();
    }
  },

  clear() {
    if (this.view) {
      this.view.destroy();
      this.view = null;
    }
  },

  hide() {
    if (this.view) {
      this.view.hide();
    }
  },

  deactivate() {
    MarkdownModelsForEditors = new WeakMap();
    SubscriptionsForEditors = new WeakMap();
    this.subscriptions.dispose();
  },

  serialize() {
    return {

    };
  },

  getDocumentModel(editor) {
    let docModel = MarkdownModelsForEditors.get(this.editor);

    if (!docModel) {
      docModel = new MarkdownModel(this.editor);
      MarkdownModelsForEditors.set(this.editor, docModel);
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
