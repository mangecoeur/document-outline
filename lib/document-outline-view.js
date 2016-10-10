'use babel';
// import $ from "jquery";

import {createElement} from './util';
import {TreeView} from './tree-view';

let DocumentTree = document.registerElement('document-tree', TreeView);

export default class DocumentOutlineView {

  constructor(headingTree) {
    // Create root element
    this.element = createElement('div', {id: 'document-outline-tree'});
    this.element.classList.add('document-outline');

    // Create message element
    // let view = document.createElement(TreeView);
    this.view = new DocumentTree();
    this.view.tree = headingTree;
    this.element.appendChild(this.view);

    this.panel = atom.workspace.addRightPanel({item: this.element});
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  hide() {
    this.panel.hide();
  }

  show() {
    this.panel.show();
  }

  toggle() {
    if (this.panel.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  set tree(data) {
    this.view.tree = data;
  }

  get tree() {
    return this.view.tree;
  }

  onItemClick(callback) {
    this.view.onItemClick(callback);
  }

}
