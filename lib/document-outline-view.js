'use babel';

import $ from "jquery";
import {createElement, depthTreeIter} from './util';
import {TreeView} from './tree-view';

let DocumentTree = document.registerElement('document-tree', TreeView);

export default class DocumentOutlineView {

  constructor(editor, docModel) {
    this.editor = editor; // useful to have the editor to which this view is bound
    // Not sure why, but have to bind callback function explicitly
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeTreeView = this.resizeTreeView.bind(this);
    this.onItemClick = this.onItemClick.bind(this);
    this.onItemDblClick = this.onItemDblClick.bind(this);
    // this.markerForCursor = this.markerForCursor.bind(this);
    this.highlightSectionAtCursor = this.highlightSectionAtCursor.bind(this);

    // Create root element
    this.element = createElement('div', {class: 'document-outline'});
    this.panel = atom.workspace.addRightPanel({item: this.element});

    let resizeBar = createElement('div', {class: 'document-outline-resize-handle'});
    resizeBar.addEventListener('mousedown', ev => this.resizeStarted(ev));
    this.element.appendChild(resizeBar);

    this.width = 200;

    // Create message element
    this.docTree = new DocumentTree();
    this.element.appendChild(this.docTree);

    this.setModel(docModel);

    this.editor.onDidChangeCursorPosition(() => {
      this.highlightSectionAtCursor();
    });
  }

  set width(value) {
    this._width = value;
    this.element.style.width = this._width + 'px';
  }

  get width() {
    return this._width;
  }

  setModel(docModel) {
    this.docModel = docModel;
    this.updateDocTree(docModel.headings);

    // this.docModel.onDidUpdate(newTree => {
    //   this.updateDocTree(newTree);
    //   this.highlightSectionAtCursor();
    // });
  }

  updateDocTree(headings) {
    this.docTree.tree = headings;
    // Set up some interactive behaviours
    this.onItemDblClick(({node, item}) => {
      if (item.children && item.children.length > 0) {
        node.querySelector('.icon').classList.toggle('icon-chevron-down');
        node.querySelector('.icon').classList.toggle('icon-chevron-right');
        $(node).find('ol').toggle();
      }
    });

    this.onItemClick(({node, item}) => {
      this.editor.scrollToBufferPosition(item.range.start, {center: true});
    });
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
    if (which !== 1) {
      this.resizeStopped();
    }
    let width;
    // atom.config.get('document-outline.showOnRightSide')
    // if (true) {
    // TODO make it possible to put outline on left side
    width = $(this.element).outerWidth() + $(this.element).offset().left - pageX;
    // } else {
    //   width = pageX - $(this.element).offset().left;
    // }

    this.width = width;
  }

  onItemClick(callback) {
    this.docTree.onItemClick(callback);
  }

  onItemDblClick(callback) {
    this.docTree.onItemDblClick(callback);
  }

  // markerForCursor() {
  //   console.log(this.docModel.sectionMarkerLayer.getMarkerCount());
  //   let pos = this.editor.getCursorBufferPosition();
  //   let marker = this.docModel.sectionMarkerLayer.findMarkers({start: pos, end: pos});
  //   console.log(marker);
  // }

  highlightSectionAtCursor() {
    $('.document-outline tree-node').removeClass('highlight');
    let pos = this.editor.getCursorBufferPosition();

    let doScroll = atom.config.get("document-outline.autoScrollOutline");
    // Add highlight to each view
    for (let item of depthTreeIter(this.docModel.headings)) {
      if (item.range.containsPoint(pos)) {
        item.view.classList.add('highlight');
      }
    }
    // Now scroll to the view
    // Need to do this separately because we want to break as soon as we reach the deepest level
    for (let item of depthTreeIter(this.docModel.headings)) {
      if (item.range.containsPoint(pos) && doScroll) {
        let topPos = item.view.offsetTop;
        $('.document-outline').animate({scrollTop: topPos - 20},
          0);
        break;
          // document.querySelector('.document-outline').scrollTop = topPos - 20;
      }
    }
  }

}
