'use babel';
import $ from "jquery";

import {createElement} from './util';
import {TreeView} from './tree-view';

let DocumentTree = document.registerElement('document-tree', TreeView);

export default class DocumentOutlineView {

  constructor(editor) {
    this.editor = editor; // useful to have the editor to which this view is bound
    // Not sure why, but have to bind callback function explicitly
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeTreeView = this.resizeTreeView.bind(this);
    this.onItemClick = this.onItemClick.bind(this);
    this.onItemDblClick = this.onItemDblClick.bind(this);

    // Create root element
    this.element = createElement('div', {class: 'document-outline'});

    let resizeBar = createElement('div', {class: 'document-outline-resize-handle'});
    resizeBar.addEventListener('mousedown', ev => this.resizeStarted(ev));

    this.element.appendChild(resizeBar);

    // Create message element
    this.docTree = new DocumentTree();

    this.element.appendChild(this.docTree);

    this.panel = atom.workspace.addRightPanel({item: this.element});
  }

  set tree(data) {
    this.docTree.tree = data;
    // Set up some interactive behaviours
    console.log(this.editor);

    this.onItemDblClick(({node, item}) => {
      if (item.children && item.children.length > 0) {
        $('.list-selectable-item span').removeClass('selected');
        node.querySelector('.tree-item-text').classList.toggle('icon-chevron-down');
        node.querySelector('.tree-item-text').classList.toggle('icon-chevron-right');
        $(node).find('ol').toggle();
      }
    });

    this.onItemClick(({node, item}) => {
      // this.editor.decorateMarker(item.marker, {type: 'highlight', class: 'document-section'});
      this.editor.scrollToBufferPosition(item.start, {center: true});
    });
  }

  get tree() {
    return this.docTree.tree;
  }

  setModel(headingTree) {
    this.tree = headingTree;
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
  }

  onItemClick(callback) {
    this.docTree.onItemClick(callback);
  }

  onItemDblClick(callback) {
    this.docTree.onItemDblClick(callback);
  }
}
