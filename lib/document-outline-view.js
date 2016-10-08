'use babel';
import $ from "jquery";

import createElement from './util';
import TreeView from './tree-view';
// registerElement('view', View);
// registerElement('tree-view-node', TreeNode);

export default class DocumentOutlineView {

  constructor(headingTree) {
    // Create root element
    // this.element = createElement('div', {id: 'document-outline-tree'});
    // this.element.classList.add('document-outline');

    // Create message element
    // const message = document.createElement('div');
    // message.textContent = 'The DocumentOutline package is Alive! It\'s ALIVE!';
    // message.classList.add('message');
    // this.element.appendChild(message);
    // let view = new TreeView();
    // let view = document.createElement(TreeView);
    let view = new TreeView();
    console.log(view);
    view.root = headingTree;
    this.panel = atom.workspace.addRightPanel({item: view});
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

}
