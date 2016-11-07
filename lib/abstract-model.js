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

    this.headings = [];

    // this.emitter.on('did-update', res => {console.log(res);});
    this.subscriptions.add(this.emitter.on('did-error', res => {
      console.log(res);
    }));

    atom.config.observe('document-outline.maxHeadingDepth', newValue => {
      this.maxDepth = newValue;
      this.update();
    });

    this.maxDepth = atom.config.get("document-outline.maxHeadingDepth");
    if (!this.maxDepth) {
      this.maxDepth = MAX_HEADING_DEPTH;
    }

    this.update();
  }

  onDidUpdate(callback) {
    this.emitter.on('did-update', callback);
  }
  onDidError(callback) {
    this.emitter.on('did-error', callback);
  }

  destroy() {
    this.subscriptions.dispose();
    this.headingMarkerLayer.destroy();
  }

  update() {
    this.headings = this.parseLevel(Point.ZERO, Point.INFINITY, 1);
    this.emitter.emit("did-update", this.headings.slice());
  }

  parseLevel(start, end, level) {
    let headings = [];
    let regex = this.HEADING_REGEX[level - 1]; // so we can give level 1 instead of level 0
    // try {
    this.buffer.scanInRange(regex, new Range(start, end), scanResult => {
      let marker = this.headingMarkerLayer.markRange(scanResult.range, {invalidate: 'inside'});
      let sectionStart = new Point(scanResult.range.start.row, 0);
      let currentBlock = {
        level: level,
        marker: marker,
        // this should be updated when we add the next result.
        range: new Range(sectionStart, end),
        headingRange: scanResult.range,
        label: scanResult.match[2],
        children: []
      };

      if (headings.length > 0) {
        // update the previous heading block at this level if there is one
        // set the end and parse its contents
        let prevBlock = headings[headings.length - 1];
        let sectionEnd = new Point(currentBlock.range.start.row - 1, 9999999);
        prevBlock.range = new Range(prevBlock.range.start, sectionEnd);
        // let sectionMarker = this.sectionMarkerLayer.markRange(prevBlock.range, {invalidate: 'inside'});

        if (level <= this.maxDepth && level <= this.HEADING_REGEX.length) {
          let subLevel = this.parseLevel(prevBlock.range.start,
                                         prevBlock.range.end,
                                         prevBlock.level + 1);
          prevBlock.children = subLevel;
          prevBlock.overwritten = 'yes';
        }
      } else if (level <= this.maxDepth && level <= this.HEADING_REGEX.length) {
        // IF we are in the first block, will parse the whole thing.
        // should be overwritten by next iteration :/
        let subLevel = this.parseLevel(currentBlock.range.start,
                                      end,
                                      level + 1);
        currentBlock.children = subLevel;
      }

      // TODO should only process the PREVIOUS one because otherwise the end will not be set
      // however kinda need to process this one even if it means duplicating
      // because not sure how to do last block otherwise
      //  how to make sure the last block gets processed?
      // maybe super inefficient, but for now could just process twice,
      // once assuming till end which gets overridden in the next iter
      // if (level <= this.maxDepth) {
      //   let subLevel = this.parseLevel(currentBlock.start,
      //                                    end,
      //                                    currentBlock.level + 1);
      //   currentBlock.children = subLevel;
      // }

      headings.push(currentBlock);
    });

    // TODO would prefer it this way,but if we do it in callback should at least guarantee to be run with async...
    // for (var i = 1; i < headings.length; i++) {
    //   let prevBlock = headings[i - 1];
    //   let thisBlock = headings[i];
    //   prevBlock.end = thisBlock.start;
    // }

    if (level <= this.maxDepth) {
      if (headings.length > 1) {
        let lastBlock = headings[headings.length - 1];
        let subLevel = this.parseLevel(lastBlock.range.start,
                                       end,
                                       lastBlock.level + 1);
        lastBlock.children = subLevel;
      }
    }

    // In case there are no results for this level, want to add an empty holder and try the next level down
    if (headings.length === 0 && level <= this.maxDepth) {
      headings = this.parseLevel(start, end, level + 1);
    }
    // } catch (error) {
    //   this.emitter.emit('did-error', error);
    //   return false;
    // }

    return headings;
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
