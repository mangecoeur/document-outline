'use babel';
/** @jsx etch.dom */

const etch = require('etch');
const {OutlineTreeView} = require('./outline-tree');

class DocumentOutlineView {

  constructor() {
    this.highlightSubscription = null;
    this.cursorPositionSubscription = null;
    this.outline = [];
    this._depthFirstItems = [];

    this.autoScroll = atom.config.get("document-outline.autoScrollOutline");
    this.doHighlight = atom.config.get("document-outline.highlightCurrentSection");
    etch.initialize(this);
  }

  getDefaultLocation() {
    return atom.config.get('document-outline.defaultSide');
  }

  getTitle() {
    return 'Outline';
  }

  getURI() {
    return 'atom://document-outline/outline';
  }

  getAllowedLocations() {
    return ['left', 'right'];
  }

  getPreferredWidth() {
    return 200;
  }

  clear() {
    this.update({outline: []});
  }

  // Tear down any state and detach
  destroy() {
    if (this.cursorPositionSubscription) {
      this.cursorPositionSubscription.dispose();
    }
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  update(props) {
    let {outline, editor} = props;
    this.outline = outline;
    // Set the outline, which should rebuild the DOM tree
    // Clear existing events and re-subscribe to make sure we don't accumulate subscriptions
    if (this.cursorPositionSubscription) {
      this.cursorPositionSubscription.dispose();
    }

    if (editor) {
      this.cursorPos = editor.getCursorBufferPosition();

      this.cursorPositionSubscription = editor.onDidChangeCursorPosition(event => {
        if (event.oldBufferPosition.row !== event.newBufferPosition.row) {
          this.cursorPos = editor.getCursorBufferPosition();
          return etch.update(this);
        }
      });
    }

    this._depthFirstItems = [];
    return etch.update(this);
  }

  render() {
    this.outlineElements = this.outline.map(tree => {
      tree.cursorPos = this.cursorPos;
      tree.doHighlight = this.doHighlight;
      return <OutlineTreeView {...tree}/>;
    });

    return <div class="document-outline" id="document-outline">
        <ol class="list-tree">{this.outlineElements}</ol>
      </div>;
  }

  readAfterUpdate() {
    if (this.autoScroll && this.cursorPos) {
      let cursorPos = this.cursorPos;
      let range;
      let item;
      let allItems = this.getDepthFirstItems(this.outline);

      for (item of allItems) {
        range = item.range;
        if (range) {
          if (range.containsPoint(cursorPos)) {
            let id = `document-outline-${item.range.start.row}-${item.range.end.row}`;
            let foundElement = document.getElementById(id);
            foundElement.scrollIntoView();
              // return foundElement.offsetTop - 20;
              // return item.offsetTop - 20;
          }
        }
      }
    }
  }

  getDepthFirstItems(root) {
    // Lazily construct a flat list of items for (in theory) fast iteration
    function collectDepthFirst(item, out) {
      let child;
      if (Array.isArray(item)) {
        for (child of item) {
          collectDepthFirst(child, out);
        }
      } else {
        for (child of item.children) {
          collectDepthFirst(child, out);
        }
        out.push(item);
      }
    }
      // Lazily get the items depth first. On first run build a flat list of items
    if (!this._depthFirstItems || this._depthFirstItems.length === 0) {
      this._depthFirstItems = [];
      collectDepthFirst(root, this._depthFirstItems);
    }
    return this._depthFirstItems;
  }
  //
  // scrollToSectionAtCursor(cursorPos) {
  //   let item;
  //   let foundElement;
  //   let allItems = this.getDepthFirstItems();
  //   for (item of allItems) {
  //     if (item.range) {
  //       if (item.range.containsPoint(cursorPos)) {
  //         let id = `document-outline-${item.range.start.row}-${item.range.end.row}`;
  //         foundElement = document.getElementById(id);
  //         this.element.scrollTop = foundElement.offsetTop - 20;
  //         break;
  //       }
  //     }
  //   }
  // }
  //
  // getDepthFirstItems() {
  //   // Lazily construct a flat list of items for (in theory) fast iteration
  //   function collectDepthFirst(item, out) {
  //     let child;
  //     if (Array.isArray(item)) {
  //       for (child of item) {
  //         collectDepthFirst(child, out);
  //       }
  //     } else {
  //       for (child of item.children) {
  //         collectDepthFirst(child, out);
  //       }
  //       out.push(item);
  //     }
  //   }
  //   // Lazily get the items depth first. On first run build a flat list of items
  //   if (!this.depthFirstItems || this.depthFirstItems.length === 0) {
  //     this.depthFirstItems = [];
  //     collectDepthFirst(this.docTree.props.outline, this.depthFirstItems);
  //   }
  //   return this.depthFirstItems;
  // }

  // highlightSectionAtCursor(cursorPos) {
  //   // TODO this gets deoptimised for 'TryCatch', no idea why.
  //   // TODO one day could prefer using the iterator, right now seems much slower
  //   // let doScroll = atom.config.get("document-outline.autoScrollOutline");
  //   let allItems = this.getDepthFirstItems();
  //
  //   let range;
  //   let item;
  //   for (item of allItems) {
  //     range = item.range;
  //     if (range) {
  //       if (range.start.row <= cursorPos.row && range.end.row > cursorPos.row) {
  //         // item.classList.add('highlight');
  //       } else {
  //         // item.classList.remove('highlight');
  //       }
  //     } else {
  //       // item.classList.remove('highlight');
  //     }
  //   }
  // }

}
//
// function offset(el) {
//   let rect = el.getBoundingClientRect();
//   let scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
//   let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
//   return {top: rect.top + scrollTop, left: rect.left + scrollLeft};
// }

module.exports = {DocumentOutlineView};
