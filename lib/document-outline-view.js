'use babel';

import $ from "jquery";
import {createElement, depthTreeIter} from './util';
import {DocumentTree} from './tree-view';
import {Point, Range} from 'atom';


export default class DocumentOutlineView {

  constructor(editor, docModel) {
    this.editor = editor; // useful to have the editor to which this view is bound
    // Not sure why, but have to bind callback function explicitly
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeTreeView = this.resizeTreeView.bind(this);

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
    this.headings = docModel.parse();
    this.updateDocTree(this.headings);
  }

  updateDocTree(headings) {
    // Set the headings, which should rebuild the DOM tree
    this.docTree.tree = headings;

    // Set up interactive behaviours
    for (let label of this.docTree.querySelectorAll('span.tree-item-text')) {
      label.addEventListener('click', event => {
        let treeNode = event.target.parentNode;
        let targetLoc = $(treeNode).data('headingStart');
        this.editor.scrollToBufferPosition(targetLoc, {center: true});
        event.stopPropagation();
      });
    }
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

  highlightSectionAtCursor() {
    $('.document-outline heading-node').removeClass('highlight');
    let pos = this.editor.getCursorBufferPosition();

    let doScroll = atom.config.get("document-outline.autoScrollOutline");
    let range;
    // Add highlight to each view
    for (let item of depthTreeIter(this.docTree.tree)) {
      range = $(item).data('headingRange');
      if (range) {
        range = new Range(range[0], range[1]);
        if (range.containsPoint(pos)) {
          item.classList.add('highlight');
        }
      }
    }
    // Now scroll to the view
    // Need to do this separately because we want to break as soon as we reach the deepest level
    for (let item of depthTreeIter(this.docTree.tree)) {
      range = $(item).data('headingRange');
      if (range) {
        range = new Range(range[0], range[1]);
        if (range.containsPoint(pos) && doScroll) {
          let topPos = item.offsetTop;
          $('.document-outline').animate({scrollTop: topPos - 20},
            0);
          break;
            // document.querySelector('.document-outline').scrollTop = topPos - 20;
        }
      }
    }
  }

}
