'use babel';

import MarkdownParse from './markdown-parse';
import DocumentOutlineView from './document-outline-view';
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

    // this.subscriptions.add(atom.workspace.observeActivePaneItem(pane => {
    //   this.updateCurrentEditor(pane);
    // });


    this.editor = atom.workspace.getActiveTextEditor();

    this.view = new DocumentOutlineView([]);
  },

  updateCurrentEditor(editor) {
    if (!editor || editor === this.editor) {
      return;
    }
    this.editor = editor;
  //   // rootScope =
  //   // if editor.getRootScopeDescriptor and scopeTools.scopeIn(
  //   //   editor.getRootScopeDescriptor().toString(),
  //   //         atom.config.get("preview-inline.scope")) {
  //   this.active = true
  //
  // } else {
  //   this.active = false
  //
  // }
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {
    return {

    };
  },

  toggle() {
    this.editor = atom.workspace.getActiveTextEditor();

    let mdParse = new MarkdownParse(this.editor.getBuffer())
    this.editor.decorateMarkerLayer(mdParse.resultsMarkerLayer, {type:'highlight', class: 'document-outline'})

    this.view = new DocumentOutlineView(mdParse.headingBlocks);

    this.view.toggle();

    return;
  }

};
