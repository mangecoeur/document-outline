'use babel';

import $ from "jquery";

import {createElement, depthTreeIter} from './util';

class _HeadingNode extends HTMLElement {

  setHeading(item) {
    // item is a node in the tree - an object with a label, level, and set of children
    this.label = item.label;
    this.level = item.level;
    this.classList.add('level' + this.level);
    this.icon = createElement('span', {class: "icon icon-chevron-down"});
    this.labelSpan = createElement('span',
                                  {class: "tree-item-text",
                                  draggable: true
                                  },
                                  this.label);

    this.appendChild(this.icon);
    this.appendChild(this.labelSpan);

    // Rather than try to store item data, store it as properties on the object
    this.range = item.range;

    this.list = createElement('ol', {class: 'list-tree'});
    this.buildChildren(item.children);
    this.setupInteractive();
  }

  createdCallback() {
    this.classList.add('list-nested-item');
    this.classList.add('list-selectable-item');
  }

  buildChildren(children) {
    if (children && children.length > 0) {
      for (let child of children) {
        let node = new HeadingNode();
        node.setHeading(child);
        this.list.appendChild(node);
      }
      this.appendChild(this.list);
    } else {
      this.classList.add('leaf');
      this.icon.classList.remove('icon-chevron-down');
      this.icon.classList.add('icon-one-dot');
    }
  }

  setupInteractive() {
    // Add interactive behaviours to tree elements
    // Collaps on double click label or single click arrow
    // Do nothing for leaf nodes (with dot icon)
    this.labelSpan.addEventListener('dblclick', () => {
      if (!this.icon.classList.contains('icon-one-dot')) {
        this.icon.classList.toggle('icon-chevron-down');
        this.icon.classList.toggle('icon-chevron-right');
        $(this.list).toggle(400);
      }
    });

    this.icon.addEventListener('click', () => {
      if (!this.icon.classList.contains('icon-one-dot')) {
        this.icon.classList.toggle('icon-chevron-down');
        this.icon.classList.toggle('icon-chevron-right');
        $(this.list).toggle(400);
      }
    });
  }
}

// FIXME something wierd about how registerElement works, doesn't seem to match
// what the docs suggest - you actually have to use the return value of registerElement
// you can't use the original class. Might be fixable with API v1 polyfill - unclear...
let HeadingNode = document.registerElement('heading-node', _HeadingNode);

class _DocumentTree extends HTMLElement {
  createdCallback() {
    // this.classList.add('tree-view');
    this.classList.add('list-tree');
    this.classList.add('has-collapsable-children');
    this.tree = [];
  }
  setModel(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }

    // Drop references to js object
    this.tree = [];

    // clear out DOM nodes
    // NOTE: this method was suggested to be the fastest by the internets
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    // Rebuild
    for (let child of data) {
      let treeNode = new HeadingNode();
      treeNode.setHeading(child);
      this.tree.push(treeNode);
      this.appendChild(treeNode);
    }

    // Get a flattend array for perf.
    this.depthFirstItems = [];
  }

  getTitle() {
    // required for Panel element
    return 'document outline';
  }

  getDepthFirstItems() {
    // Lazily construct a flat list of items for (in theory) fast iteration
    function collectDepthFirst(item, out) {
      let child;
      if (Array.isArray(item)) {
        for (child of item) {
          collectDepthFirst(child, out);
        }
      } else {
        for (child of item.list.children) {
          collectDepthFirst(child, out);
        }
        out.push(item);
      }
    }
    // Lazily get the items depth first. On first run build a flat list of items
    if (!this.depthFirstItems || this.depthFirstItems.length === 0) {
      this.depthFirstItems = [];
      collectDepthFirst(this.tree, this.depthFirstItems);
    }
    return this.depthFirstItems;
  }

  // setupDrag() {
  //   let state;
  //   let xOffset = 0;
  //   let yOffset = 0;
  //   let dropTarget;
  //
  //   function mouseDown({node, event}) {
  //     event.stopPropagation();
  //     state = 1;
  //     var tmpOffset = $(node).offset();
  //     xOffset = tmpOffset.left - event.pageX;
  //     yOffset = tmpOffset.top - event.pageY;
  //     return false;
  //   }
  //
  //   function mouseMove({node, event}) {
  //     if (state === 1 || state === 2) {
  //       state = 2;
  //
  //       $(node).offset({
  //         left: event.pageX + xOffset,
  //         top: event.pageY + yOffset
  //       });
  //     }
  //     return false;
  //   }
  //
  //   function mouseOver({node, event}) {
  //     if (state === 2) {
  //       event.stopPropagation();
  //       dropTarget = node;
  //       node.classList.add('droptarget');
  //       console.log((node));
  //     }
  //   }
  //
  //   function mouseOut({node, event}) {
  //     if (state === 2) {
  //       event.stopPropagation();
  //       dropTarget = null;
  //       // node.classList.remove('droptarget');
  //     }
  //   }
  //
  //   function mouseUp({node, event}) {
  //     if (state === 1) {
  //       state = 0;
  //     } else if (state === 2) {
  //       event.stopPropagation();
  //       state = 0;
  //       node.style.position = '';
  //       node.style.top = '';
  //       node.style.left = '';
  //       if (dropTarget) {
  //       }
  //     }
  //   }
  //
  //   for (let child of this.treeNodes) {
  //     child.onMouseDown(mouseDown);
  //   }
  //
  //   for (let child of this.treeNodes) {
  //     child.onMouseOver(mouseOver);
  //   }
  //   for (let child of this.treeNodes) {
  //     child.onMouseOut(mouseOut);
  //   }
  //
  //   for (let child of this.treeNodes) {
  //     child.onMouseUp(mouseUp);
  //   }
  //
  //   for (let child of this.treeNodes) {
  //     child.onMouseMove(mouseMove);
  //   }
  // }

}
let DocumentTree = document.registerElement('document-tree', _DocumentTree);

export {DocumentTree};
