'use babel';

import $ from "jquery";
import {createElement, depthTreeIter} from './util';
import {DocumentTree} from './tree-view';
import {Range} from 'atom';

// global width, should be stored across panes.
let WIDTH = 200;

export default class DocumentOutlineView {

  constructor(editor, headings) {
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

    this.width = WIDTH;

    // Create message element
    this.docTree = new DocumentTree();
    this.element.appendChild(this.docTree);

    this.setModel(headings);

    this.editor.onDidChangeCursorPosition(() => {
      this.highlightSectionAtCursor();
    });
  }

  set width(value) {
    WIDTH = value;
    this._width = WIDTH;
    this.element.style.width = this._width + 'px';
  }

  get width() {
    return this._width;
  }

  setModel(headings) {
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
    for (let node of this.element.querySelectorAll('heading-node')) {
      node.classList.remove('highlight');
    }
    let cursorPos = this.editor.getCursorBufferPosition();

    let doScroll = atom.config.get("document-outline.autoScrollOutline");
    let range;

    // TODO: nicer alternative to $(item).data
    runDepthFirst(this.docTree.tree, item => {
      range = $(item).data('headingRange');
      if (range) {
        range = new Range(range[0], range[1]);
        if (range.containsPoint(cursorPos)) {
          item.classList.add('highlight');
        }
      }
    });

    // Now scroll to the view
    // Need to do this separately because we want to break as soon as we reach the deepest level
    if (doScroll) {
      for (let item of depthTreeIter(this.docTree.tree)) {
        range = $(item).data('headingRange');
        if (range) {
          range = new Range(range[0], range[1]);
          if (range.containsPoint(cursorPos)) {
            let topPos = item.offsetTop;
            this.element.scrollTop = topPos - 20;
            break;
          }
        }
      }
    }
  }
}

function runDepthFirst(item, callback) {
  if (Array.isArray(item)) {
    for (let child of item) {
      runDepthFirst(child, callback);
    }
  } else {
    for (let child of item.subHeadings) {
      runDepthFirst(child, callback);
    }
    callback(item);
  }
}
