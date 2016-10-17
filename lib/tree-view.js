'use babel';

import $ from "jquery";

import {Emitter} from 'event-kit';
import {createElement} from './util';

class _TreeNode extends HTMLElement {
  set item(item) {
    this._item = item;
    // TODO modifies the passed item object, not keen on this :/
    this.item.view = this;
    this.label = item.label;
    this.level = item.level;
    this.classList.add('level' + this.level);
    this.setAttribute('draggable', true);

    this.buildChildren();
  }

  get item() {
    return this._item;
  }

  createdCallback() {
    // because it doesn't seem like we can pass arguments, we have to wait to build
    // the structure
    this.emitter = new Emitter();

    this.classList.add('list-nested-item');
    this.classList.add('list-selectable-item');

    // this.addEventListener('dragstart', this.onDragStart, true);
    this.addEventListener('dragstart', (ev) => {
      console.log(ev);
    }, false);

    // this.addEventListener('dblclick', this.dblClickItem);
  }

  buildChildren() {
    let icon = createElement('span', {class: "icon icon-chevron-down"});
    this.labelSpan = createElement('span',
                                  {class: "tree-item-text"},
                                  this.label);
    this.labelSpan.addEventListener('click', () => {
      this.emitter.emit('on-click', {node: this, item: this.item});
      // $('.tree-item-text').removeClass('selected');
      // this.labelSpan.classList.add('selected');
    });

    this.labelSpan.addEventListener('dblclick', () => {
      this.emitter.emit('on-dbl-click', {node: this, item: this.item});
    });
    this.appendChild(icon);
    this.appendChild(this.labelSpan);

    if (this.item.children && this.item.children.length > 0) {
      let list = createElement('ol', {class: 'list-tree'});
      for (let child of this.item.children) {
        let node = new TreeNode();
        node.item = child;
        list.appendChild(node);
      }
      this.appendChild(list);
    } else {
      this.classList.add('leaf');
      this.querySelector('.icon').classList.remove('icon-chevron-down');
      this.querySelector('.icon').classList.add('icon-one-dot');
    }
  }

  setCollapsed() {
    if (this.item.children && this.item.children.length > 0) {
      this.classList.toggle('collapsed');
    }
  }

  setSelected() {
    this.classList.add('selected');
  }

  onDragStart(data) {
    console.log(data);
  }

  onClick(callback) {
    this.emitter.on('on-click', callback);
    if (this.item.children) {
      for (let child of this.item.children) {
        child.view.onClick(callback);
      }
    }
  }

  onDblClick(callback) {
    this.emitter.on('on-dbl-click', callback);
    if (this.item.children) {
      for (let child of this.item.children) {
        child.view.onDblClick(callback);
      }
    }
  }

  onSelect(callback) {
    this.emitter.on('on-select', callback);
    if (this.item.children) {
      for (let child of this.item.children) {
        child.view.onSelect(callback);
      }
    }
  }

  clickLabel(event) {
    this.classList.toggle('selected');
  }

  clickItem(event) {
    // this.classList.toggle('selected');
    if (this.item.children) {
      // TODO think this code was meant to toggle collapse if you click on the arrow icon only.
      // let selected = this.classList.contains('selected');
      // this.classList.remove('selected');
      // let target = $(this).find('.list-item:first');
      // let left = target.position().left;
      // let right = target.children('span').position().left;
      // let width = right - left;
      // if (event.offsetX <= width) {
      //   this.classList.toggle('collapsed');
      // }
      // if (selected) {
      //   this.classList.add('selected');
      // }
      // if (event.offsetX <= width) {
      //   return false;
      // }
    }
    this.emitter.emit('on-select', {node: this, item: this.item});
    return false;
  }

  dblClickItem(event) {
    this.emitter.emit('on-dbl-click', {node: this, item: this.item});
    return false;
  }

}

// FIXME something wierd about how registerElement work, doesn't seem to match
// what the docs suggest - you actually have to use the return value of registerElement
// you can't use the original class. Might be fixable with API v1 polyfill - unclear...
let TreeNode = document.registerElement('tree-node', _TreeNode);

class TreeView extends HTMLElement {
  createdCallback() {
    // this.classList.add('tree-view');
    this.classList.add('list-tree');
    this.classList.add('has-collapsable-children');
    this.emitter = new Emitter();
    this.treeNodes = [];
  }

  constructor() {
    super();
    this._ignoreRoot = true;
  }

  deactivate() {
    this.remove();
  }

  onSelect(callback) {
    this.emitter.on('on-select', callback);
  }

  set ignoreRoot(ignoreRoot) {
    this._ignoreRoot = ignoreRoot;
  }

  get ignoreRoot() {
    return this._ignoreRoot;
  }

  set tree(data) {
    this._tree = data;
    // TODO remove jquery dependency if possible
    $(this).empty();
    // FIXME could probably just wrap non-array data as array
    if (Array.isArray(data)) {
      for (let child of data) {
        let treeNode = new TreeNode();
        treeNode.item = child;
        child.view = treeNode;
        this.treeNodes.push(treeNode);
        // todo might need some kind of weak referencing, else circular.

        this.appendChild(treeNode);
      }
    } else {
      let treeNode = new TreeNode();
      treeNode.item = data;
      this.treeNodes.push(treeNode);
      this.appendChild(treeNode);
    }
  }

  get tree() {
    return this._tree;
  }

  onItemClick(callback) {
    for (let child of this.treeNodes) {
      child.onClick(callback);
    }
  }

  onItemDblClick(callback) {
    for (let child of this.treeNodes) {
      child.onDblClick(callback);
    }
  }
  //
  // traversal(root, callback) {
  //   callback(root.item);
  //   if (root.item.children) {
  //     for (let child of root.item.children) {
  //       this.traversal(child.view, callback);
  //     }
  //   }
  // }
  // toggleTypeVisible(type) {
  //   this.traversal(this.rootNode, item => {
  //     if (item.type === type) {
  //       item.view.toggle();
  //     }}
  //     );
  // }
  //
  // clearSelect() {
  //   $('.list-selectable-item').classList.remove('selected');
  // }
  //
  // select(item) {
  //   this.clearSelect();
  //   item.view.setSelected();
  // }

  getTitle() {
    // required for Panel element
    return 'document outline';
  }
}

export {TreeView};
