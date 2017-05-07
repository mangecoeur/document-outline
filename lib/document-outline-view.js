'use babel';

import {createElement} from './util';
import {DocumentTree} from './tree-view';
import {CompositeDisposable} from 'atom';

// global width, should be stored across panes.
let WIDTH = 200;

export default class DocumentOutlineView {

  constructor(editor, headings) {
    this.editor = editor; // useful to have the editor to which this view is bound
    this.subscriptions = new CompositeDisposable();
    // Not sure why, but have to bind callback function explicitly
    this.resizeStopped = this.resizeStopped.bind(this);
    this.resizeTreeView = this.resizeTreeView.bind(this);
    this.highlightSectionAtCursor = this.highlightSectionAtCursor.bind(this);

    // Create root element
    this.element = createElement('div', {class: 'document-outline'});

    let resizeBar;
    if (atom.config.get('document-outline.showOnRightSide')) {
      this.panel = atom.workspace.addRightPanel({item: this.element});
      resizeBar = createElement('div', {class: 'document-outline-resize-left-handle'});
    } else {
      this.panel = atom.workspace.addLeftPanel({item: this.element});
      resizeBar = createElement('div', {class: 'document-outline-resize-right-handle'});
    }

    resizeBar.addEventListener('mousedown', ev => this.resizeStarted(ev));
    this.element.appendChild(resizeBar);

    this.width = WIDTH;

    // Create message element
    this.docTree = new DocumentTree();
    this.element.appendChild(this.docTree);

    this.setModel(headings);
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

    // Set up interactive behaviours that need the current editor
    for (let label of this.docTree.querySelectorAll('span.tree-item-text')) {
      label.addEventListener('click', event => {
        let treeNode = event.target.parentNode;
        let range = treeNode.range;
        this.editor.scrollToBufferPosition(range.start, {center: true});
        event.stopPropagation();
      });
    }

    // Clear existing events and re-subscribe to make sure we don't accumulate subscriptions
    this.subscriptions.dispose();
    this.subscriptions.add(this.editor.onDidChangeCursorPosition(event => {
      // Highligh section in outline only if buffor position change
      // NOTE: highlightSection is wierdly resource intensive.
      if (event.oldBufferPosition.row !== event.newBufferPosition.row) {
        this.highlightSectionAtCursor(event.cursor);
      }
    }));
  }

  // Tear down any state and detach
  destroy() {
    this.subscriptions.dispose();
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
    document.addEventListener('mouseup', this.resizeStopped);
    document.addEventListener('mousemove', this.resizeTreeView);
  }

  resizeStopped() {
    document.removeEventListener('mousemove', this.resizeTreeView);
    document.removeEventListener('mouseup', this.resizeStopped);
  }

  resizeTreeView({pageX, which}) {
    if (which !== 1) {
      this.resizeStopped();
    }
    let width;
    const showOnRightSide = atom.config.get('document-outline.showOnRightSide');
    if (showOnRightSide) {
      width = this.element.offsetWidth + offset(this.element).left - pageX;
    } else {
      width = pageX - offset(this.element).left;
    }

    this.width = width;
  }

  highlightSectionAtCursor(cursor) {
    let cursorPos = cursor.getBufferPosition();

    let doScroll = atom.config.get("document-outline.autoScrollOutline");
    let range;

    // apply the highlight starting with the deepest level
    // TODO do we actually care about starting at deepest level anymore?
    runDepthFirst(this.docTree.tree, item => {
      range = item.range;
      if (range) {
        if (range.start.row <= cursorPos.row && range.end.row >= cursorPos.row) {
          item.classList.add('highlight');
        } else {
          item.classList.remove('highlight');
        }
      } else {
        item.classList.remove('highlight');
      }
    });

    // Now scroll to the view
    // Need to do this separately because we want to break as soon as we reach the deepest level
    if (doScroll) {
      runDepthTillBreak(this.docTree.tree, item => {
        range = item.range;
        if (range) {
          if (range.containsPoint(cursorPos)) {
            this.element.scrollTop = item.offsetTop - 20;
            return false;
          }
        }
        return true;
      });
    }
  }
}

function offset(el) {
  let rect = el.getBoundingClientRect();
  let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return {top: rect.top + scrollTop, left: rect.left + scrollLeft};
}

function runDepthFirst(item, callback) {
  if (Array.isArray(item)) {
    for (let child of item) {
      runDepthFirst(child, callback);
    }
  } else {
    for (let child of item.list.children) {
      runDepthFirst(child, callback);
    }
    callback(item);
  }
}

function runDepthTillBreak(item, callback) {
  // Fake break using closure
  // Callback should return false when it finds where it wants to break
  let doContinue = true;

  function _runDepthFirst(item, callback) {
    if (doContinue) {
      if (Array.isArray(item)) {
        for (let child of item) {
          _runDepthFirst(child, callback);
        }
      } else {
        for (let child of item.list.children) {
          _runDepthFirst(child, callback);
        }

        doContinue = callback(item);
      }
    }
  }
  _runDepthFirst(item, callback);
}
