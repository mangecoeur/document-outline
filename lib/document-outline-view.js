const {Point} = require('atom');
const {DocumentTree} = require('./tree-view');
const {OutlineTreeRoot} = require('./outline-tree');

class DocumentOutlineView {

  constructor() {
    this.highlightSubscription = null;
    this.cursorPositionSubscription = null;
    // this.element = createElement('div', {class: 'document-outline'});
    this.outline = [];
    // this.docTree = new DocumentTree();
    this.docTree = new OutlineTreeRoot({
      outline: this.outline,
      autoScroll: atom.config.get("document-outline.autoScrollOutline"),
      doHighlight: atom.config.get("document-outline.highlightCurrentSection")

    });
    this.element = this.docTree.element;
    this.depthFirstItems = [];
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
    this.docTree.update({outline: []});
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

  update(outline, editor) {
    this.outline = outline;
    this.docTree.update({outline: outline,
      cursorPos: editor.getCursorBufferPosition(),
      autoScroll: atom.config.get("document-outline.autoScrollOutline"),
      doHighlight: atom.config.get("document-outline.highlightCurrentSection")
    });

    // Set the outline, which should rebuild the DOM tree
    // Clear existing events and re-subscribe to make sure we don't accumulate subscriptions
    if (this.cursorPositionSubscription) {
      this.cursorPositionSubscription.dispose();
    }

    this.cursorPositionSubscription = editor.onDidChangeCursorPosition(event => {
      if (event.oldBufferPosition.row !== event.newBufferPosition.row) {
        this.docTree.update({outline: outline,
          cursorPos: editor.getCursorBufferPosition()});
      }
    });
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
