'use babel';
import $ from "jquery";

import {createElement} from './util';
import {TreeView} from './tree-view';

let DocumentTree = document.registerElement('document-tree', TreeView);

export default class DocumentOutlineView {

  constructor(headingTree) {
    // Not sure why, but have to bind callback function explicitly
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeTreeView = this.resizeTreeView.bind(this);

    // Create root element
    this.element = createElement('div', {id: 'document-outline-tree'});
    this.element.classList.add('document-outline');

    this.resizeBar = createElement('div', {class: 'document-outline-resize-handle'});
    this.resizeBar.addEventListener('mousedown', ev => this.resizeStarted(ev));

    // this.resizeBar.addEventListener('mousedown', this.resizeStarted.bind(this));
    //  @on 'mousedown', '.tree-view-resize-handle',
    this.element.appendChild(this.resizeBar);

    // Create message element
    // let view = document.createElement(TreeView);
    this.docTree = new DocumentTree();
    this.docTree.tree = headingTree;
    // this.element.classList.add('document-outline');

    this.element.appendChild(this.docTree);

    this.panel = atom.workspace.addRightPanel({item: this.element});
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
    this.panel.destroy();
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
    this.docTree.tree = data;
  }

  get tree() {
    return this.docTree.tree;
  }

  resizeStarted() {
    $(document).on('mouseup', this.resizeStopped);
    $(document).on('mousemove', this.resizeTreeView);
  }

  resizeStopped() {
    $(document).off('mousemove', this.resizeTreeView);
    $(document).off('mouseup', this.resizeStopped);
  }

  resizeTreeView({pageX, which}) {
    // console.log(which);
    if (which !== 1) {
      this.resizeStopped();
    }
    let width;
    // atom.config.get('tree-view.showOnRightSide')
    if (true) {
      // width = $(this).offset().left - pageX;
      width = $(this.element).outerWidth() + $(this.element).offset().left - pageX;
    } else {
      width = pageX - $(this.element).offset().left;
    }

    this.element.style.width = width + 'px';
    // this.width(width);
  }
  onItemClick(callback) {
    this.docTree.onItemClick(callback);
  }

  onItemDblClick(callback) {
    this.docTree.onItemDblClick(callback);
  }

}
