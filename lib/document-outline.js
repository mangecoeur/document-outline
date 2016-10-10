'use babel';

import MarkdownParse from './markdown-parse';
import DocumentOutlineView from './document-outline-view';
import {CompositeDisposable} from 'atom';
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

export default {

  markdownOutlineView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    // this.markdownOutlineView = new MarkdownOutlineView(state.markdownOutlineViewState);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.active = false;

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'document-outline:toggle': () => {
        // this.active = true;
        this.toggle();
        this.updateCurrentEditor(atom.workspace.getActiveTextEditor());
      }
    }));

    this.subscriptions.add(atom.workspace.observeActivePaneItem(pane => {
      this.updateCurrentEditor(pane);
    }));

    // this.editor = atom.workspace.getActiveTextEditor();
  },

  updateCurrentEditor(editor) {
    if (!editor || editor === this.editor) {
      return;
    }
    this.editor = editor;

    // editor.getGrammar()
    let scopeDescriptor = editor.getRootScopeDescriptor();
    if (scopeDescriptor && scopeDescriptor.scopes.includes('source.gfm')) {
      // this.active = true;
      if (this.active) {
        this.show();
      }
    } else {
      // this.active = false;
      this.hide();
    }
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {

    };
  },
  hide() {
    if (this.view) {
      this.view.hide();
    }
  },

  show() {
    if (!this.view) {
      this.editor = atom.workspace.getActiveTextEditor();
      // let mdParse = new MarkdownParse(this.editor.getBuffer());
      // TODO associate parsers with open editors...
      let mdParse = new MarkdownParse(this.editor);

      this.editor.decorateMarkerLayer(mdParse.resultsMarkerLayer,
        {type: 'highlight', class: 'document-outline-section-highlight'});
      this.view = new DocumentOutlineView(mdParse.headingBlocks);

      this.view.onItemClick(({node, item}) => {
        this.editor.decorateMarker(item.marker, {type: 'highlight', class: 'document-section'});
        this.editor.scrollToBufferPosition(item.start);
      });
    } else {
      this.view.show();
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
    }
  }

  // toggle() {
  //   if (!this.view) {
  //     this.editor = atom.workspace.getActiveTextEditor();
  //     // let mdParse = new MarkdownParse(this.editor.getBuffer());
  //     // TODO associate parsers with open editors...
  //     let mdParse = new MarkdownParse(this.editor);
  //
  //     this.editor.decorateMarkerLayer(mdParse.resultsMarkerLayer,
  //       {type: 'highlight', class: 'document-outline-section-highlight'});
  //     this.view = new DocumentOutlineView(mdParse.headingBlocks);
  //
  //     this.view.onItemClick(({node, item}) => {
  //       // TODO clear decorations from marker and from others
  //       this.editor.decorateMarker(item.marker, {type: 'highlight', class: 'document-section'});
  //       this.editor.scrollToBufferPosition(item.start);
  //     });
  //   } else {
  //     this.view.toggle();
  //   }
  //
  //   return;
  // }

};
