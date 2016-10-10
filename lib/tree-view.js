'use babel';

import $ from "jquery";

import {Emitter} from 'event-kit';
import {createElement} from './util';

class _TreeNode extends HTMLElement {
  // constructor() {
  //   // Note: seems like HTML custom elements don't actually let
  //   // you have constructor arguments even though people suggest they should
  //   super();
  //   // let {label, icon, children} = item;
  //
  // }

  set item(item) {
    this._item = item;
    // modifies the passed item object, not keen on this :/
    this.item.view = this;
    this.label = item.label;
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

    // this.addEventListener('click', this.clickItem);
    // this.addEventListener('dblclick', this.dblClickItem);
  }

  buildChildren() {
    this.labelSpan = createElement('span',
                                  {class: "icon icon-chevron-right"},
                                  this.label);
    this.labelSpan.addEventListener('click', () => {
      this.emitter.emit('on-click', {node: this, item: this.item});
      // this.labelSpan.classList.toggle('selected');
    });

    this.labelSpan.addEventListener('dblclick', () => {
      this.emitter.emit('on-dbl-click', {node: this, item: this.item});
      this.labelSpan.classList.toggle('selected');
    });

    this.appendChild(this.labelSpan);

    if (this.item.children) {
      let list = createElement('ul', {class: 'list-tree'});
      for (let child of this.item.children) {
        let node = new TreeNode();
        node.item = child;
        list.appendChild(node);
      }
      this.appendChild(list);
    } else {
    }
  }
  setCollapsed() {
    if (this.item.children) {
      this.classList.toggle('collapsed');
    }
  }

  setSelected() {
    this.classList.add('selected');
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
    // ignoreRoot useful in case we want multiple top levels,
    // just create additional node with children list of all top level
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

        // treeNode.onDblClick(({node, item}) => {
        //   node.setCollapsed();
        // });
        //
        // treeNode.onSelect(({node, item}) => {
        //   this.clearSelect();
        //   node.setSelected();
        //   this.emitter.emit('on-select', {node, item});
        // });
        this.appendChild(treeNode);
      }
      // $(this).find('list-selectable-item');
    } else {
      let treeNode = new TreeNode();
      treeNode.item = data;
      this.treeNodes.push(treeNode);

      treeNode.onDblClick(({node, item}) => {
        node.setCollapsed();
      });

      treeNode.onSelect(({node, item}) => {
        this.clearSelect();
        node.setSelected();
        this.emitter.emit('on-select', {node, item});
      });

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

  traversal(root, callback) {
    callback(root.item);
    if (root.item.children) {
      for (let child of root.item.children) {
        this.traversal(child.view, callback);
      }
    }
  }
  toggleTypeVisible(type) {
    this.traversal(this.rootNode, item => {
      if (item.type === type) {
        item.view.toggle();
      }}
      );
  }

  clearSelect() {
    $('.list-selectable-item').classList.remove('selected');
  }
  select(item) {
    this.clearSelect();
    item.view.setSelected();
  }

  getTitle() {
    return 'document outline';
  }
}

export {TreeView};
