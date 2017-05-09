'use babel';

import {CompositeDisposable} from 'atom';
import {DocumentTree} from './tree-view';
import {createElement} from './util';

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
    this.scrollToSectionAtCursor = this.scrollToSectionAtCursor.bind(this);
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
    this.docTree.setModel(headings);

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

    // NOTE: highlightSection is wierdly resource intensive.
    if (atom.config.get("document-outline.highlightCurrentSection")) {
      this.highlightSectionAtCursor(this.editor.getCursorBufferPosition());
      this.subscriptions.add(this.editor.onDidChangeCursorPosition(event => {
        // Highligh section in outline only if buffor position change
        if (event.oldBufferPosition.row !== event.newBufferPosition.row) {
          this.highlightSectionAtCursor(event.cursor.getBufferPosition());
        }
      }));
    }

    if (atom.config.get("document-outline.autoScrollOutline")) {
      this.scrollToSectionAtCursor(this.editor.getCursorBufferPosition());
      this.subscriptions.add(this.editor.onDidChangeCursorPosition(event => {
        if (event.oldBufferPosition.row !== event.newBufferPosition.row) {
          this.scrollToSectionAtCursor(event.cursor.getBufferPosition());
        }
      }));
    }
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
    // atom.config.get('document-outline.showOnRightSide')
    // if (true) {
    // TODO make it possible to put outline on left side
    width = this.element.offsetWidth + offset(this.element).left - pageX;
    // } else {
    //   width = pageX - $(this.element).offset().left;
    // }

    this.width = width;
  }

  highlightSectionAtCursor(cursorPos) {
    // TODO this gets deoptimised for 'TryCatch', no idea why.
    // TODO one day could prefer using the iterator, right now seems much slower
    // let doScroll = atom.config.get("document-outline.autoScrollOutline");
    let allItems = this.docTree.getDepthFirstItems();

    let range;
    let item;
    for (item of allItems) {
      range = item.range;
      if (range) {
        if (range.start.row <= cursorPos.row && range.end.row > cursorPos.row) {
          item.classList.add('highlight');
        } else {
          item.classList.remove('highlight');
        }
      } else {
        item.classList.remove('highlight');
      }
    }
    //
    // if (doScroll) {
    //   for (item of allItems) {
    //     range = item.range;
    //     if (range) {
    //       if (range.containsPoint(cursorPos)) {
    //         this.element.scrollTop = item.offsetTop - 20;
    //         break;
    //       }
    //     }
    //   }
    // }
  }

  scrollToSectionAtCursor(cursorPos) {
    // let doScroll = atom.config.get("document-outline.autoScrollOutline");
    let range;
    let item;
    let allItems = this.docTree.getDepthFirstItems();
    // if (doScroll) {
    for (item of allItems) {
      range = item.range;
      if (range) {
        if (range.containsPoint(cursorPos)) {
          this.element.scrollTop = item.offsetTop - 20;
          break;
        }
      }
      // }
    }
  }
}

function offset(el) {
  let rect = el.getBoundingClientRect();
  let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return {top: rect.top + scrollTop, left: rect.left + scrollLeft};
}

// function runDepthFirst(item, callback) {
//   let child;
//   if (Array.isArray(item)) {
//     for (child of item) {
//       runDepthFirst(child, callback);
//     }
//   } else {
//     for (child of item.list.children) {
//       runDepthFirst(child, callback);
//     }
//     callback(item);
//   }
// }
//
// function runDepthTillBreak(item, callback) {
//   // Fake break using closure
//   // Callback should return false when it finds where it wants to break
//   let doContinue = true;
//
//   function _runDepthFirst(item, callback) {
//     if (doContinue) {
//       if (Array.isArray(item)) {
//         for (let child of item) {
//           _runDepthFirst(child, callback);
//         }
//       } else {
//         for (let child of item.list.children) {
//           _runDepthFirst(child, callback);
//         }
//
//         doContinue = callback(item);
//       }
//     }
//   }
//   _runDepthFirst(item, callback);
// }
