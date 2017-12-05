'use babel';
/** @jsx etch.dom */

// export type OutlineProvider = {
//   name: string,
//   // If there are multiple providers for a given grammar, the one with the highest priority will be
//   // used.
//   priority: number,
//   grammarScopes: Array<string>,
//   updateOnEdit?: boolean,
//   getOutline(editor: TextEditor): Promise<?Outline>,
// };
//
// export type OutlineTree = {
//   icon?: string, // from atom$Octicon (that type's not allowed over rpc so we use string)
//   kind?: OutlineTreeKind, // kind you can pass to the UI for theming
//
//   // Must be one or the other. If both are present, tokenizedText is preferred.
//   plainText?: string,
//   tokenizedText?: TokenizedText,
//
//   // If user has atom-ide-outline-view.nameOnly then representativeName is used instead.
//   representativeName?: string,
//
//   startPosition: atom$Point,
//   endPosition?: atom$Point,
//   landingPosition?: atom$Point,
//   children: Array<OutlineTree>,
// };
//
// export type Outline = {
//   outlineTrees: Array<OutlineTree>,
// };
//
// // Kind of outline tree - matches the names from the Language Server Protocol v2.
// export type OutlineTreeKind =
//   | 'file'
//   | 'module'
//   | 'namespace'
//   | 'package'
//   | 'class'
//   | 'method'
//   | 'property'
//   | 'field'
//   | 'constructor'
//   | 'enum'
//   | 'interface'
//   | 'function'
//   | 'variable'
//   | 'constant'
//   | 'string'
//   | 'number'
//   | 'boolean'
//   | 'array';
//
// export type ResultsStreamProvider = {
//   getResultsStream: () => Observable<Result<OutlineProvider, ?Outline>>,
// };

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
  // Required: The `render` method returns a virtual DOM tree representing the
  // current state of the component. Etch will call `render` to build and update
  // the component's associated DOM element. Babel is instructed to call the
  // `etch.dom` helper in compiled JSX expressions by the `@jsx` pragma above.
  // TODO add interactive using dom event binding
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

class OutlineTreeRoot {
  constructor(props) {
    // Item should be a list of outline views
    this.props = props;
    this.autoScroll = this.props.autoScroll !== undefined ? this.props.autoScroll : this.autoScroll
    this.doHighlight = this.props.doHighlight !== undefined ? this.props.doHighlight : this.autoScroll
    etch.initialize(this);
  }

  update(props) {
    this.props = props;
    this._depthFirstItems = [];
    return etch.update(this);
  }

  render() {
    // let props = {cursorPos: this.props.cursorPos, children: this.props.outline,
    //   plainText: ''};
    // return <div class="document-outline" id="document-outline"><OutlineTreeView {...props} ref="childOutlines"/></div>;

    this.outlineElements = this.props.outline.map(tree => {
      tree.cursorPos = this.props.cursorPos;
      tree.doHighlight = this.doHighlight;
      return <OutlineTreeView {...tree}/>;
    });

    return <div class="document-outline" id="document-outline">
      <ol class="list-tree">{this.outlineElements}</ol>
    </div>;
  }

  readAfterUpdate() {
    if (this.autoScroll) {
      let cursorPos = this.props.cursorPos;
      let range;
      let item;
      let allItems = this.getDepthFirstItems(this.props.outline);

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

  // getScrollTargetOffest(cursorPos) {
  //   let range;
  //   let item;
  //   // let allItems = this.getDepthFirstItems(this.outlineElements);
  //   let allItems = this.getDepthFirstItems(this.props.outline);
  //
  //   for (item of allItems) {
  //     range = item.range;
  //     if (range) {
  //       if (range.containsPoint(cursorPos)) {
  //         let id = `document-outline-${item.range.start.row}-${item.range.end.row}`;
  //         let foundElement = document.getElementById(id);
  //         foundElement.scrollIntoView()
  //         // return foundElement.offsetTop - 20;
  //         // return item.offsetTop - 20;
  //       }
  //     }
  //   }
  // }

}

module.exports = {OutlineTreeView, OutlineTreeRoot};
