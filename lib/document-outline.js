'use babel';

import MarkdownParse from './markdown-parse';
import DocumentOutlineView from './document-outline-view';
import {CompositeDisposable} from 'atom';
import $ from "jquery";

// import {Emitter} from 'event-kit';

// function loadScript(src) {
//  return new Promise(function(resolve, reject) {
//    const script = document.createElement('script');
//    script.async = true;
//    script.src = src;
//    script.onload = resolve;
//    script.onerror = reject;
//    document.head.appendChild(script);
//  });
// }
//
// // Lazy load the polyfill if necessary.
// if (!supportsCustomElementsV1) {
//   loadScript('./bower_components/custom-elements/custom-elements.min.js').then(e => {
//     // Polyfill loaded.
//   });
// } else {
//   // Native support. Good to go.
// }
//
// TODO: make sure that mdParse subsciption is correctly stored and then disposed of on toggle.

let MarkdownParsersForEditors = new WeakMap();

export default {

  markdownOutlineView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.active = false;

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
    // this.editor = atom.workspace.getActiveTextEditor();
  },

  updateCurrentEditor(editor) {
    if (!editor || editor === this.editor) {
      return;
    }
    if (!this.active) {
      this.clear();
      return;
    }

    if (editor.getRootScopeDescriptor) {
      this.editor = editor;

      let scopeDescriptor = editor.getRootScopeDescriptor();
      if (scopeDescriptor && scopeDescriptor.scopes.includes('source.gfm')) {
        this.clear();

        if (this.active) {
          this.show();
        } else {
          this.hide();
        }
      } else {
        this.hide();
      }
    }
  },

  show() {
    if (this.view) {
      this.view.show();
    } else {
      let mdParser = this.getDocumentParser(this.editor);

      this.view = new DocumentOutlineView(this.editor);
      this.view.tree = mdParser.headingBlocks;

      this.subscriptions.add(this.editor.onDidStopChanging(() => mdParser.parseAll()));
      // this.subscriptions.add(this.editor.onDidSave(() => mdParser.parseAll()));

      mdParser.onDidUpdate(newTree => {
        this.view.tree = newTree;
      });
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
      this.show();
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
    this.subscriptions.dispose();
  },

  serialize() {
    return {

    };
  },

  getDocumentParser(editor) {
    let mdParser = MarkdownParsersForEditors.get(this.editor);

    if (!mdParser) {
      mdParser = new MarkdownParse(this.editor);
      MarkdownParsersForEditors.set(this.editor, mdParser);
    }
    return mdParser;
  }

};
