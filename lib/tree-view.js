const $ = require("jquery");
const {createElement} = require('./util');

class HeadingNode extends HTMLElement {

  update(item) {
    // item is a node in the tree - an object with a label, level, and set of children
    this.plainText = item.plainText;
    this.level = item.level;
    this.classList.add('level' + this.level);
    this.icon = createElement('span', {class: "icon icon-chevron-down"});
    this.labelSpan = createElement('span',
      {class: "tree-item-text",
        draggable: true
      },
                                  this.plainText);

    this.appendChild(this.icon);
    this.appendChild(this.labelSpan);

    // Rather than try to store item data, store it as properties on the object
    this.range = item.range;

    this.list = createElement('ol', {class: 'list-tree'});
    this.buildChildren(item.children);
  }

  connectedCallback() {
    this.classList.add('list-nested-item');
    this.classList.add('list-selectable-item');
    this.setupInteractive();
  }

  buildChildren(children) {
    if (children && children.length > 0) {
      for (let child of children) {
        let node = new HeadingNode();
        node.update(child);
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

window.customElements.define('heading-node', HeadingNode);
// TODO move/merge into outline view
class DocumentTree extends HTMLElement {
  connectedCallback() {
    // this.classList.add('tree-view');
    this.classList.add('list-tree');
    this.classList.add('has-collapsable-children');
    this.tree = [];
  }
  update(data) {
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
      treeNode.update(child);
      this.tree.push(treeNode);
      this.appendChild(treeNode);
    }
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
window.customElements.define('document-tree', DocumentTree);

module.exports = {DocumentTree};
