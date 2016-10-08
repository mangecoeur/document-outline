'use babel';

// {$, $$, View, ScrollView} 'atom-space-pen-views'
import $ from "jquery";

import {Emitter} from 'event-kit';
import createElement from './util';

// TODO register the custom elements. Note that this uses an old API and will probably have to chagen one day
function registerElement(elementName, elementClass) {
  document.registerElement(elementName, elementClass);
}


class View extends HTMLElement {
  constructor() {
    super();
  }

  toggleClass(className) {
    return this.classList.toggle(className);
  }

  hasClass(className) {
    return this.classList.contains(className);
  }

  removeClass(className) {
    return this.classList.remove(className);
  }

  addClass(className) {
    return this.classList.add(className);
  }

  find(selector) {
    return $(this).find(selector);
  }
}

class TreeNode extends View {
  constructor(item) {
    super();
    this.emitter = new Emitter();
    this.item = item;
    // modifies the passed item object, not keen on this :/
    this.item.view = this;

    this.children = item.children;
    this.label = item.label;
    // let {label, icon, children} = item;

    this.emitter.on('dblclick', this.dblClickItem);
    this.emitter.on('click', this.clickItem);
  }

  createdCallback() {
    if (this.children) {
      this.element = createElement('li',
                                   {class: 'list-nested-item list-selectable-item'});
      let labelDiv = createElement('div', {class: 'list-item'});
      let labelSpan = createElement('span',
                                    {class: "icon #{icon}"},
                                    this.label);
      labelDiv.appendChild(labelSpan);

      let list = createElement('ul', {class: 'list-tree'});
      for (let child of this.children) {
        // append
        list.appendChild(new TreeNode(child));
      }
      this.element.appendChild(list);

      // let labelDiv = createElement('div', {class: 'list-item'})
      //   .appendChild(createElement('span', {class: "icon #{icon}"}, label));

        // li class: 'list-nested-item list-selectable-item', =>
        //   this.div class: 'list-item', =>
        //     @span class: "icon #{icon}", label
        //   @ul class: 'list-tree', =>
        //     for child in children
        //       @subview 'child', new TreeNode(child)
    } else {
      this.element = createElement('li', {class: 'list-nested-item list-selectable-item'});
      this.element.appendChild(createElement('span', {class: "icon #{icon}"}, this.label))
        //
        // @li class: 'list-item list-selectable-item', =>
        //   @span class: "icon #{icon}", label
    }
  }

  setCollapsed() {
    if (this.item.children) {
      this.toggleClass('collapsed');
    }
  }

  setSelected() {
    this.addClass('selected');
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

  clickItem(event) {
    if (this.item.children) {
      let selected = this.hasClass('selected');
      this.removeClass('selected');
      let $target = this.find('.list-item:first');
      let left = $target.position().left;
      let right = $target.children('span').position().left;
      let width = right - left;
      if (event.offsetX <= width) {
        this.toggleClass('collapsed');
      }
      if (selected) {
        this.addClass('selected');
      }
      if (event.offsetX <= width) {
        return false;
      }
    }
    this.emitter.emit('on-select', {node: this, item: this.item});
    return false;
  }

  dblClickItem(event) {
    this.emitter.emit('on-dbl-click', {node: this, item: this.item});
    return false;
  }

}

export class TreeView extends View {
  createdCallback() {
    this.addClass('tree-view');
    this.addClass('list-tree has-collapsable-children');
    // this.root = createElement('ul', {class: 'list-tree has-collapsable-children'});
    // this.appendChild(this.root);
      // @div class: '-tree-view-', =>
      //   @ul class: 'list-tree has-collapsable-children', outlet: 'root'
  }

  constructor() {
    super();
    this.emitter = new Emitter();
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

  set root(root) {
    // ignoreRoot useful in case we want multiple top levels,
    // just create additional node with children list of all top level
    this.rootNode = new TreeNode(root);

    this.rootNode.onDblClick(({node, item}) => {
      node.setCollapsed();
    });

    this.rootNode.onSelect(({node, item}) => {
      this.clearSelect();
      node.setSelected();
      this.emitter.emit('on-select', {node, item});
    });

    $(this).empty();

    // div = createElement('div')
    if (this.ignoreRoot) {
      for (let child of root.children) {
        this.appendChild(child.view);
      }
    } else {
      this.appendChild(this.rootNode);
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
  // sortByName(ascending = true) {
  //   this.traversal(this.rootNode, item => {
  //     item.children.sort((a, b) => {
  //       if (ascending) {
  //         return a.name.localeCompare(b.name);
  //       } else {
  //         return b.name.localeCompare(a.name);
  //       }
  //     }
  //     );});
  //   this.setRoot(this.rootNode.item);
  // }
  //
  // sortByRow(ascending = true) {
  //   this.traversal(this.rootNode, item => {
  //     item.children.sort((a, b) => {
  //       if (ascending) {
  //         return a.position.row - b.position.row;
  //       } else {
  //         return b.position.row - a.position.row;
  //       }});
  //   });
  //   this.setRoot(this.rootNode.item);
  // }

  clearSelect() {
    $('.list-selectable-item').removeClass('selected');
  }
  select(item) {
    this.clearSelect();
    item.view.setSelected();
  }

  getTitle() {
    return 'document outline';
  }
}

// registerElement('view', View);
registerElement('tree-view-node', TreeNode);
registerElement('tree-view', TreeView);
