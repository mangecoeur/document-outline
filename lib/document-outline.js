'use babel';

import MarkdownParse from './markdown-parse';
import MarkdownOutlineView from './markdown-outline-view';
import {CompositeDisposable} from 'atom';
import {Emitter} from 'event-kit';

export default {

  markdownOutlineView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    // this.markdownOutlineView = new MarkdownOutlineView(state.markdownOutlineViewState);

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'markdown-outline:toggle': () => this.toggle()
    }));

    this.editor = atom.workspace.getActiveTextEditor();
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {

    };
  },

  toggle() {
    let emitter = new Emitter()
    let r = new MarkdownParse(this.editor.getBuffer())
    this.editor.decorateMarkerLayer(r.resultsMarkerLayer, {type:'highlight', class: 'markdown-outline'})


    return;
    // return (
    //   this.modalPanel.isVisible() ?
    //   this.modalPanel.hide() :
    //   this.modalPanel.show()
    // );
  }

};
