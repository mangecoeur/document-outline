'use babel';
import {Point, Range, Emitter, CompositeDisposable} from 'atom';

const MAX_HEADING_DEPTH = 4;

export default class AbstractModel {
  // NOTE: if it was possible to simply scan through applied scopes, wouldn't need most of this...
  constructor(editorOrBuffer, headingRegexes) {
    this.emitter = new Emitter();
    this.subscriptions = new CompositeDisposable();
    this.HEADING_REGEX = headingRegexes;

    if (editorOrBuffer.getBuffer) {
      this.buffer = editorOrBuffer.getBuffer();
      this.editor = editorOrBuffer;
    } else {
      this.buffer = editorOrBuffer;
      this._editor = null;
    }

    this.headingMarkerLayer = this.buffer.addMarkerLayer({maintainHistory: false});
    this.sectionMarkerLayer = this.buffer.addMarkerLayer({maintainHistory: false});

    // NOTE: don't store the headings in the model because it seems to cause memory leak issues.
    // this.headings = [];

    // this.emitter.on('did-update', res => {console.log(res);});
    this.subscriptions.add(this.emitter.on('did-error', err => {
      console.log(err);
    }));

    atom.config.observe('document-outline.maxHeadingDepth', newValue => {
      // Make sure we don't call update if nothing has changed.
      // Important if we want to do more setup in subclasses before update is called
      if (newValue) {
        this.maxDepth = newValue;
        this.update();
      }
    });

    this.maxDepth = atom.config.get("document-outline.maxHeadingDepth");
    if (!this.maxDepth) {
      this.maxDepth = MAX_HEADING_DEPTH;
    }
    // Don't call update or parse, let subclasses do that
    // this.update();
  }

  onDidUpdate(callback) {
    return this.emitter.on('did-update', callback);
  }
  onDidError(callback) {
    return this.emitter.on('did-error', callback);
  }

  destroy() {
    this.subscriptions.dispose();
    this.headingMarkerLayer.destroy();
  }

  update() {
    // this.headings = this.parseLevel(Point.ZERO, Point.INFINITY, 1);
    let headings = this.parse();
    // this.emitter.emit("did-update", this.headings.slice());
    this.emitter.emit("did-update", headings);
  }

  parse() {
    return this.parseLevel(Point.ZERO, Point.INFINITY, 1);
  }

  parseLevel(start, end, level) {
    let rawHeadings = [];
    // let regex = this.HEADING_REGEX[level - 1]; // so we can give level 1 instead of level 0
    let regex = this.HEADING_REGEX;

    this.buffer.scanInRange(regex, new Range(start, end), scanResult => {
      // allow subclasses to customise how they get level, lable from regex
      let res = this.getRegexData(scanResult);
      let heading = {
        level: res.level,
        headingRange: scanResult.range,
        label: res.label,
        children: [],
        range: new Range(scanResult.range.start, Point.INFINITY)
      };
      rawHeadings.push(heading);
    });
    let stack = [{
      level: 0,
      label: '_hidden_root',
      headingRange: new Range(Point.ZERO, Point.INFINITY),
      children: [],
      range: new Range(Point.ZERO, Point.INFINITY)
    }];

    let top;
    for (let heading of rawHeadings) {
      if (heading.level > this.maxDepth) {
        continue;
      }
      top = stack.pop();
      if (heading.level > top.level) {
        top.children.push(heading);
        stack.push(top);
        stack.push(heading);
      } else if (heading.level === top.level) {
        // At equal level, we close the previous heading
        top.range.end = heading.headingRange.start;
        // Then get the parent
        top = stack.pop();
        top.children.push(heading);
        stack.push(top);
        stack.push(heading);
      } else if (top.level > heading.level) {
        // This starts a new section at a more important level
        // roll up the stack
        top.range.end = heading.headingRange.start;
        while (top) {
          top = stack.pop();
          // Close each range until we get to the suitable parent
          top.range.end = heading.headingRange.start;
          if (top.level < heading.level) {
            break;
          }
        }
        top.children.push(heading);
        stack.push(top);
        stack.push(heading);
      }
    }
    return stack[0].children;

      //
      // if (!prevHeading && heading.level > stack[stack.length - 1].level) {
      //   stack[stack.length - 1].children.push(heading);
      // } else if (heading.level <= this.maxDepth && heading.level === prevHeading.level) {
      //   stack[stack.length - 1].children.push(heading);
      // } else if (heading.level > prevHeading.level) {
      //   // Drop down one level
      //   stack.push(prevHeading); // might need to make sure we don't overwrite here...
      //   prevHeading = null;
      //   stack[stack.length - 1].children.push(heading);
      // }
      // else if (heading.level <= stack[stack.length - 1].level) {
      //   let parent = stack[stack.length - 1];
      //   while (heading.level <= parent.level) {
      //     parent = stack.pop();
      //   }
      //   parent.children.push(heading);
      // }
      // prevHeading = heading;

    //
    // this.buffer.scanInRange(regex, new Range(start, end), scanResult => {
    //   let marker = this.headingMarkerLayer.markRange(scanResult.range, {invalidate: 'inside'});
    //   let sectionStart = new Point(scanResult.range.start.row, 0);
    //   let currentBlock = {
    //     level: level,
    //     marker: marker,
    //     // this should be updated when we add the next result.
    //     range: new Range(sectionStart, end),
    //     headingRange: scanResult.range,
    //     label: scanResult.match[2],
    //     children: []
    //   };
    //
    //   if (headings.length > 0) {
    //     // update the previous heading block at this level if there is one
    //     // set the end and parse its contents
    //     let prevBlock = headings[headings.length - 1];
    //     let sectionEnd = new Point(currentBlock.range.start.row - 1, 9999999);
    //     prevBlock.range = new Range(prevBlock.range.start, sectionEnd);
    //     // let sectionMarker = this.sectionMarkerLayer.markRange(prevBlock.range, {invalidate: 'inside'});
    //
    //     if (level <= this.maxDepth && level <= this.HEADING_REGEX.length) {
    //       let subLevel = this.parseLevel(prevBlock.range.start,
    //                                      prevBlock.range.end,
    //                                      prevBlock.level + 1);
    //       prevBlock.children = subLevel;
    //       prevBlock.overwritten = 'yes';
    //     }
    //   }
    //   if (level <= this.maxDepth && level <= this.HEADING_REGEX.length) {
    //     // IF we are in the first block, will parse the whole thing.
    //     // should be overwritten by next iteration :/
    //     let subLevel = this.parseLevel(currentBlock.range.start,
    //                                   end,
    //                                   level + 1);
    //     currentBlock.children = subLevel;
    //   }
    //
    //   // TODO should only process the PREVIOUS one because otherwise the end will not be set
    //   // however kinda need to process this one even if it means duplicating
    //   // because not sure how to do last block otherwise
    //   //  how to make sure the last block gets processed?
    //   // maybe super inefficient, but for now could just process twice,
    //   // once assuming till end which gets overridden in the next iter
    //   // if (level <= this.maxDepth) {
    //   //   let subLevel = this.parseLevel(currentBlock.start,
    //   //                                    end,
    //   //                                    currentBlock.level + 1);
    //   //   currentBlock.children = subLevel;
    //   // }
    //
    //   headings.push(currentBlock);
    // });

    // TODO would prefer it this way,but if we do it in callback should at least guarantee to be run with async...
    // for (var i = 1; i < headings.length; i++) {
    //   let prevBlock = headings[i - 1];
    //   let thisBlock = headings[i];
    //   prevBlock.end = thisBlock.start;
    // }
    //
    // if (level <= this.maxDepth) {
    //   if (headings.length > 1) {
    //     let lastBlock = headings[headings.length - 1];
    //     let subLevel = this.parseLevel(lastBlock.range.start,
    //                                    end,
    //                                    lastBlock.level + 1);
    //     lastBlock.children = subLevel;
    //   }
    // }
  }

  recreateMarker(marker) {
    marker.destroy();
    this.createMarker(marker.getBufferRange());
  }

  createMarker(range) {
    let marker = this.headingMarkerLayer.markRange(range, {invalidate: 'inside'});
    return marker;
  }

  sectionContains(point, section) {
    // actually this first part is enough to check, since sections are nested
    // if a section conatins will return true no need to check children...
    // rather want to to depth first...
    let result;
    for (let section of section.children) {
      result = this.sectionContains(point, section);
      if (result) {
        return result;
      }
    }

    if (section.start.row >= point.row && section.end.row <= point.row) {
      return true;
    }

    return false;
  }

}
