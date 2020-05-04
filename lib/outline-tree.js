'use babel';
/** @jsx etch.dom */

const etch = require('etch');
const {Point} = require('atom');

etch.setScheduler(atom.views);

class OutlineTreeView {
  constructor(props) {
    this.plainText = props.plainText;
    this.childOutlines = props.children ? props.children : [];
    this.extra = props.extra;
    this.startRow = props.startPosition ? props.startPosition.row : null;
    this.endRow = props.endPosition ? props.endPosition.row : null;
    for (let child of this.childOutlines) {
      child.doHighlight = props.doHighlight;
      child.cursorPos = props.cursorPos;
    }
    this.highlight = '';
    if (props.cursorPos) {
      if (props.cursorPos >= this.startRow && props.cursorPos < this.endRow && props.doHighlight) {
        this.highlight = 'item-highlight';
      }
    }
    this.autoCollapse = props.autoCollapse;
    this.showChildren = true;
    this.updateIcon();
    etch.initialize(this);
  }

  update(props) {
    // this.cursorPos = props.cursorPos;
    this.plainText = props.plainText;
    this.childOutlines = props.children;
    this.extra = props.extra;
    this.startRow = props.startPosition ? props.startPosition.row : null;
    this.endRow = props.endPosition ? props.endPosition.row : null;

    for (let child of this.childOutlines) {
      child.doHighlight = props.doHighlight;
      child.cursorPos = props.cursorPos;
      child.autoCollapse = props.autoCollapse;
    }

    this.highlight = '';
    if (props.cursorPos) {
      if (props.cursorPos.row >= this.startRow && props.cursorPos.row < this.endRow && props.doHighlight) {
        this.highlight = 'item-highlight';
        this.showChildren = true;
      } else {
        // False if autoCollapse is set, True otherwise
        this.showChildren = !props.autoCollapse;
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
	
    let extraSpan = <span>&nbsp;</span>; 
    if (this.extra != '')
    {
      extraSpan = <span style="font-size:70%;color:yellow;">&nbsp;{this.extra}</span>;
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
    <span class="tree-item-text" on={{
      click: this.didClick,
      dblclick: this.toggleSubtree}}>
    {this.plainText}</span>
	{extraSpan}
    {sublist}
    </div>;
    // draggable="true"
  }
  // // Optional: Destroy the component. Async/await syntax is pretty but optional.
  // async destroy () {
  //   // call etch.destroy to remove the element and destroy child components
  //   await etch.destroy(this)
  //   // then perform custom teardown logic here...
  // }
  
  // [NOTE] from @CBenghi: 
  // this function is taken from history.js in the cursor-history package.
  // depends on cursor-history being installed because of the class style used.
  //
  // TODO: make the style class configurable in document-outline.
  // 
  flash(editor, highlightPoint) {
    if (this.flashMarker) this.flashMarker.destroy()
    // markBufferPosition needs a point
    this.flashMarker = editor.markBufferPosition(highlightPoint)
    editor.decorateMarker(this.flashMarker, {type: "line", class: "cursor-history-flash-line"})

    let disposable

    const destroyMarker = () => {
      if (disposable) {
        disposable.dispose()
        disposable = null
      }
      if (this.flashMarker) {
        this.flashMarker.destroy()
        this.flashMarker = null
      }
    }

    disposable = editor.onDidChangeCursorPosition(destroyMarker)
    // [NOTE] animation-duration has to be shorter than this value(1sec)
    setTimeout(destroyMarker, 1000)
  }

  didClick() {
    const editor = atom.workspace.getActiveTextEditor();
    const cursorPos = editor.getCursorBufferPosition();
    const documentPos = new Point(this.startRow - 1, 0);
    editor.scrollToBufferPosition(documentPos, {center: true});
    atom.views.getView(editor).focus();

    // NOTE: don't reset to cursor position if we autoCollapse
    // because that would reset the outline view again!
    if (!this.autoCollapse) {
      editor.setCursorBufferPosition(cursorPos, {autoscroll: false});
    }
    
    // TODO: @CBbenghi, the call to flash() should be made optional via config
    this.flash(editor, documentPos);
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
