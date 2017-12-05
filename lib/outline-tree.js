'use babel';
/** @jsx etch.dom */

const etch = require('etch');
const {Point} = require('atom');

etch.setScheduler(atom.views);

class OutlineTreeView {
  constructor(props) {
    // this.props = props;
    this.plainText = props.plainText;
    this.childOutlines = props.children ? props.children : [];
    this.startRow = props.startPosition ? props.startPosition.row : null;
    this.endRow = props.endPosition ? props.endPosition.row : null;
    for (let child of this.childOutlines) {
      child.doHighlight = props.doHighlight;
      child.cursorPos = props.cursorPos;
    }
    this.highlight = '';
    if (props.cursorPos) {
      if (props.cursorPos >= this.startRow && props.cursorPos < this.endRow && props.doHighlight) {
        this.highlight = 'highlight';
      }
    }
    this.showChildren = true;
    this.updateIcon();
    etch.initialize(this);
  }

  update(props) {
    // this.props = props;
    // this.cursorPos = props.cursorPos;
    this.childOutlines = props.children;
    this.startRow = props.startPosition ? props.startPosition.row : null;
    this.endRow = props.endPosition ? props.endPosition.row : null;

    for (let child of this.childOutlines) {
      child.doHighlight = props.doHighlight;
      child.cursorPos = props.cursorPos;
    }
    // TODO if cursorPos changes but stays in start/end range, dont update
    // Hopefully etch is smart enough to make no changes if highlight doesn't change
    this.highlight = '';
    if (props.cursorPos) {
      if (props.cursorPos.row >= this.startRow && props.cursorPos.row < this.endRow && props.doHighlight) {
        this.highlight = 'highlight';
        // let root = document.getElementById("document-outline");
        // root.scrollTop = item.offsetTop - 20;
      }
    }
    this.updateIcon();
    return etch.update(this);
  }

  render() {
    let sublist = <span></span>;

    if (this.childOutlines && this.showChildren) {
      sublist = <ol class="list-tree">
          {this.childOutlines.map(child => {
            return <OutlineTreeView {...child}/>;
          })}
        </ol>;
    }

    let iconClass = `icon ${this.icon}`;
    let itemClass = `list-nested-item list-selectable-item ${this.highlight}`;
    let itemId = `document-outline-${this.startRow}-${this.endRow}`;

    return <div class={itemClass}
    startrow={this.startRow} endrow={this.endRow}
    id={itemId}
    key={itemId}
    ref="outlineElement"
    >
    <span class={iconClass} on={{click: this.toggleSubtree}}></span>
    <span class="tree-item-text" draggable="true" on={
    {
      click: this.didClick,
      dblclick: this.toggleSubtree}}>
    {this.plainText}</span>
    {sublist}
    </div>;
  }
  // // Optional: Destroy the component. Async/await syntax is pretty but optional.
  // async destroy () {
  //   // call etch.destroy to remove the element and destroy child components
  //   await etch.destroy(this)
  //   // then perform custom teardown logic here...
  // }

  didClick() {
    let editor = atom.workspace.getActiveTextEditor();
    const pt = new Point(this.startRow - 1, 0);
    editor.scrollToBufferPosition(pt, {center: true});
  }

  toggleSubtree() {
    this.showChildren = !this.showChildren;
    this.updateIcon();
    return etch.update(this);
  }

  updateIcon() {
    if (this.childOutlines && this.childOutlines.length > 0 && this.showChildren) {
      this.icon = 'icon-chevron-down';
    } else if (this.childOutlines && this.childOutlines.length > 0 && !this.showChildren) {
      this.icon = 'icon-chevron-right';
    } else {
      this.icon = 'icon-one-dot';
    }
  }
}

module.exports = {OutlineTreeView};
