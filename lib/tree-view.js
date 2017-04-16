'use babel';

import $ from "jquery";

import {createElement} from './util';

class _HeadingNode extends HTMLElement {

  setHeading(item) {
    // item is a node in the tree - an object with a label, level, and set of children
    // TODO if you re-instate this, need to make sure you don't recursively add the current items
    // children to each item (i.e. add the whole subtree every time to each sub-item)
    // this._item = item;
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
    $(this).data('headingStart', [item.range.start.row, item.range.start.column]);
    $(this).data('headingRange', [[item.range.start.row, item.range.start.column],
                                  [item.range.end.row, item.range.end.column]]);
    this.subHeadings = [];
    this.buildChildren(item.children);
    this.setupInteractive();
  }

  createdCallback() {
    this.classList.add('list-nested-item');
    this.classList.add('list-selectable-item');
  }

  buildChildren(children) {
    if (children && children.length > 0) {
      let list = createElement('ol', {class: 'list-tree'});
      for (let child of children) {
        let node = new HeadingNode();
        node.setHeading(child);
        list.appendChild(node);
        this.subHeadings.push(node);
      }
      this.appendChild(list);
    } else {
      this.classList.add('leaf');
      this.icon.classList.remove('icon-chevron-down');
      this.icon.classList.add('icon-one-dot');
    }
  }

  setupInteractive() {
    this.labelSpan.addEventListener('dblclick', () => {
      this.icon.classList.toggle('icon-chevron-down');
      this.icon.classList.toggle('icon-chevron-right');
      $(this).find('ol').toggle(400);
    });

    this.icon.addEventListener('click', () => {
      this.icon.classList.toggle('icon-chevron-down');
      this.icon.classList.toggle('icon-chevron-right');
      $(this).find('ol').toggle(400);
    });
  }
}

// FIXME something wierd about how registerElement work, doesn't seem to match
// what the docs suggest - you actually have to use the return value of registerElement
// you can't use the original class. Might be fixable with API v1 polyfill - unclear...
let HeadingNode = document.registerElement('heading-node', _HeadingNode);

class _DocumentTree extends HTMLElement {
  createdCallback() {
    // this.classList.add('tree-view');
    this.classList.add('list-tree');
    this.classList.add('has-collapsable-children');
    this.treeNodes = [];
  }

  set tree(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    this._tree = this.treeNodes;
    $(this).empty();
    for (let child of data) {
      let treeNode = new HeadingNode();
      treeNode.setHeading(child);
      this.treeNodes.push(treeNode);
      this.appendChild(treeNode);
    }

    // this.setupDrag();
  }

  get tree() {
    return this._tree;
  }

  setModel(tree) {
    this.tree = tree;
  }

  getTitle() {
    // required for Panel element
    return 'document outline';
  }

  setupDrag() {
    let state;
    let xOffset = 0;
    let yOffset = 0;
    let dropTarget;

    function mouseDown({node, event}) {
      event.stopPropagation();
      state = 1;
      var tmpOffset = $(node).offset();
      xOffset = tmpOffset.left - event.pageX;
      yOffset = tmpOffset.top - event.pageY;
      return false;
    }

    function mouseMove({node, event}) {
      if (state === 1 || state === 2) {
        state = 2;

        $(node).offset({
          left: event.pageX + xOffset,
          top: event.pageY + yOffset
        });
      }
      return false;
    }

    function mouseOver({node, event}) {
      if (state === 2) {
        event.stopPropagation();
        dropTarget = node;
        node.classList.add('droptarget');
        console.log((node));
      }
    }

    function mouseOut({node, event}) {
      if (state === 2) {
        event.stopPropagation();
        dropTarget = null;
        // node.classList.remove('droptarget');
      }
    }

    function mouseUp({node, event}) {
      if (state === 1) {
        state = 0;
      } else if (state === 2) {
        event.stopPropagation();
        state = 0;
        node.style.position = '';
        node.style.top = '';
        node.style.left = '';
        if (dropTarget) {
          // $(node).detach();
          // $(dropTarget).find('ol').append(node);
        }
      }
    }

    for (let child of this.treeNodes) {
      child.onMouseDown(mouseDown);
    }

    for (let child of this.treeNodes) {
      child.onMouseOver(mouseOver);
    }
    for (let child of this.treeNodes) {
      child.onMouseOut(mouseOut);
    }

    for (let child of this.treeNodes) {
      child.onMouseUp(mouseUp);
    }

    for (let child of this.treeNodes) {
      child.onMouseMove(mouseMove);
    }
  }

}
let DocumentTree = document.registerElement('document-tree', _DocumentTree);

export {DocumentTree};
