'use babel';
// import {Emitter} from 'event-kit';
// import _ from 'underscore-plus';
import {Point, Range, Emitter, CompositeDisposable, TextBuffer} from 'atom';

// Use textbuffer api e.g. scan https://atom.io/docs/api/v1.6.0/TextBuffer#instance-scan
// to find heading positions. The scan accepts a callback that will take the regions as ranges.
// should be able to use these to mark the headings themselves and the whole region from one heading
// to the next.
// Also have scanInRange -important could make it much easier to get sub-headings without re-scanning
// whole document. Do recursive - scan for top level headings and get block ranges for each top level. Then
// scan in range for each top block to get next level down, etc... build a nested set of
// range markers together with data tree holding references to those markers.
function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
//
// function * text_scan(textBuffer, regex) {
//   const caller = yield;
//   textBuffer.scan(regex, scanResult => caller.success(scanResult));
// }
//
// function scanH1(textBuffer) {
//     // actually there is scan function on both editor and buffer
//     // TODO use marker layers to group markers
//     // TODO use some immutable data structure...
//   let tree = {};
//
//     // TODO this will be all headers. Idea is to add all headers of given level inside current block to list
//     // since we do top level then depth first down. also since will have to go over twice first to get
//     // all heading positions and then for each heading to set the position of the end based on the next heading
//     // start
//   let h1List = [];
//
//     // might be easiest to use events/stream and collect results...
//
//   textBuffer.scan(/(^#)[^#](.*)/, scanResult => {
//     console.log(scanResult);
//         // match, matchText, range, stop, replace)
//     let hBlock = {
//       start: scanResult.range.start,
//       headingRange: scanResult.range,
//       heading: scanResult.matchText
//     };
//         // do we really need to store the range if we also store the marker...
//         // hBlock.headingMarker = textBuffer.markRange(range, {options...});
//     h1List.push(hBlock);
//     scanResult.stop();
//   });
//
//     // TODO: this is probably wrong - no guarantee the h1list will be filled correctly before being returned
//     // Thinking wrapping `scan` as promise and using array generator format might be the most sanity preserving
//
//   return h1List;
// }

const H1_REGEX = /(^#)[^#](.*)/g;
const H2_REGEX = /(^##)[^#](.*)/g;
const H3_REGEX = /(^###)[^#](.*)/g;

const HEADING_REGEX = [H1_REGEX, H2_REGEX, H3_REGEX];
const MAX_HEADING_DEPTH = 3;

let ResultsMarkerLayersByEditor = new WeakMap();

export default class MarkdownParse {
  constructor(buffer) {
    this.emitter = new Emitter();
    this.buffer = buffer;

    this.resultsMarkerLayer = this.resultsMarkerLayerForTextBuffer(this.buffer);

    // this.buffer = new TextBuffer();
    this.subscriptions = null;
    this.markers = [];
    this.editor = null;
    // this.editor = this.buffer;
    this.headingBlocks = [];

    this.recreateMarkers.bind(this);
    // let recreateMarkers = this.recreateMarkers.bind(this);
    this.emitter.on('did-update', res => {console.log(res);});
    this.emitter.on('did-error', res => {console.log(res);});

    // this.recreateMarkers();
    this.processAll();
  }

  onDidUpdate(callback) {
    this.emitter.on('did-update', callback);
  }
  onDidError(callback) {
    this.emitter.on('did-error', callback);
  }
  onDidChangeCurrentResult(callback) {
    this.emitter.on('did-change-current-result', callback);
  }
  setEditor(editor) {
    this.editor = editor;
    this.subscriptions.dispose();
    if (this.editor & this.editor.buffer) {
      this.subscriptions = new CompositeDisposable();
      this.subscriptions.add(this.editor.buffer.onDidChange(this.bufferChanged.bind(this)));
      this.subscriptions.add(this.editor.buffer.onDidStopChanging(this.bufferStoppedChanging.bind(this)));
      this.subscriptions.add(this.editor.onDidAddSelection(this.setCurrentMarkerFromSelection.bind(this)));
      this.subscriptions.add(this.editor.onDidChangeSelectionRange(this.setCurrentMarkerFromSelection.bind(this)));
      this.resultsMarkerLayer = this.resultsMarkerLayerForTextEditor(this.editor);
      this.resultsLayerDecoration.destroy();
      this.resultsLayerDecoration = this.editor.decorateMarkerLayer(this.resultsMarkerLayer, {type: 'highlight', class: 'find-result'});
    }
    this.recreateMarkers();
  }

  getEditor() {
    return this.editor;
  }

  resultsMarkerLayerForTextBuffer(buffer) {
    let layer = ResultsMarkerLayersByEditor.get(buffer);
    if (!layer) {
      layer = buffer.addMarkerLayer({maintainHistory: false});
      ResultsMarkerLayersByEditor.set(buffer, layer);
    }
    return layer;
  }

  resultsMarkerLayerForTextEditor(editor) {
    let layer = ResultsMarkerLayersByEditor.get(editor);
    if (!layer) {
      layer = editor.addMarkerLayer({maintainHistory: false});
      ResultsMarkerLayersByEditor.set(editor, layer);
    }
    return layer;
  }

  destroy() {
    this.subscriptions.dispose();
  }

  // ###
  // Section Private
  // ###

  recreateMarkers() {
    this.markers.forEach(marker => {
      marker.destroy();
    });
    this.markers.length = 0;
    let markers = this.createMarkers(Point.ZERO, Point.INFINITY);
    if (markers) {
      this.markers = markers;
      this.emitter.emit("did-update", this.markers.slice());
    }
  }

  createMarkers(start, end) {
    let newMarkers = [];
    let regex = H1_REGEX;
    try {
      this.buffer.scanInRange(regex, new Range(start, end), scanResults => {
        newMarkers.push(this.createMarker(scanResults.range));
      });
    } catch (error) {
          // error.message = "Search string is too large" if /RegExp too big$/.test(error.message)
      this.emitter.emit('did-error', error);
      return false;
    }

    return newMarkers;
  }

  processAll() {
    this.headingBlocks = this.processLevel(Point.ZERO, Point.INFINITY, 1);
    this.emitter.emit("did-update", this.headingBlocks.slice());
    return this.headingBlocks;
  }

  /**
   * create markers at level, where level is in {1, 2, 3} for h1, h2, h3
   * @return
   */
  processLevel(start, end, level) {
    let headingBlocks = [];
    let regex = HEADING_REGEX[level - 1]; // so we can give level 1 instead of level 0
    try {
      this.buffer.scanInRange(regex, new Range(start, end), scanResult => {
        let marker = this.createMarker(scanResult.range);

        let currentBlock = {
          level: level,
          marker: marker,
          start: scanResult.range.start,
          end: end, // this should be updated when we add the next result.
          headingRange: scanResult.range,
          heading: scanResult.matchText,
          children: []
        };

        if (headingBlocks.length > 0) {
          // update the previous heading block at this level if there is one...
          let prevBlock = headingBlocks[headingBlocks.length - 1];
          prevBlock.end = currentBlock.start; // TODO might need to tweak end to be non-inclusive...

          if (level <= MAX_HEADING_DEPTH) {
            let subLevel = this.processLevel(prevBlock.start,
                                             prevBlock.end,
                                             prevBlock.level + 1);
            prevBlock.children = subLevel;
          }
        }

        // TODO actually should only process the PREVIOUS one because otherwise the end will not be set
        // however kinda need to process this one even if it means duplicating because not sure how to do last block otherwise
        // if (level <= MAX_HEADING_DEPTH) {
        //   let subLevel = this.processLevel(currentBlock.start,
        //                                    currentBlock.end,
        //                                    currentBlock.level + 1);
        //   currentBlock.children = subLevel;
        // }
        // TODO how to make sure the last block gets processed?
        // maybe super inefficient, but for now could just process twice,
        // once assuming till end which gets overridden in the next iter
        headingBlocks.push(currentBlock);
      });

      // TODO for now process the last block outside of 'loop' though problem is not sure it will be ready...
      // TODO ok so it's not ready and it fails...
      if (level <= MAX_HEADING_DEPTH) {
        if (headingBlocks.length > 1) {
          let lastBlock = headingBlocks[headingBlocks.length - 1];
          let subLevel = this.processLevel(lastBlock.start,
                                         lastBlock.end,
                                         lastBlock.level + 1);
          lastBlock.children = subLevel;
        }
      }

      // TODO: should this be inside the callback? would at least guarantee that the item exists
      // if (level < MAX_HEADING_DEPTH) {
      //   for (let hBlock of headingBlocks) {
      //     let subLevel = this.processLevel(hBlock.start, hBlock.end, hBlock.level + 1);
      //     hblock.children = subLevel;
      //   }
      // }
    } catch (error) {
          // error.message = "Search string is too large" if /RegExp too big$/.test(error.message)
      this.emitter.emit('did-error', error);
      return false;
    }

    return headingBlocks;
  }

  bufferStoppedChanging() {
    // let changes = this.patch.changes();
    let changes = this.buffer.getChangesSinceCheckpoint();
    let scanStart;
    let scanEnd = Point.ZERO;
    let spliceStart;
    let spliceEnd;
    let markerIndex = 0;
    let next = changes.next();

    while (!next.done) {
      let change = next.value;
      let changeStart = change.position;
      let changeEnd = changeStart.traverse(change.newExtent);
      if (changeEnd.isLessThan(scanEnd)) {
        continue;
      }

      let precedingMarkerIndex = -1;
      let marker = this.markers[markerIndex];
      while (marker) {
        if (marker.isValid()) {
          if (marker.getBufferRange().end.isGreaterThan(changeStart)) {
            break;
          }
          precedingMarkerIndex = markerIndex;
        } else {
          this.markers[markerIndex] = this.recreateMarker(marker);
        }
        markerIndex++;
        marker = this.markers[markerIndex];
      }

      let followingMarkerIndex = -1;
      marker = this.markers[markerIndex];
      while (marker) {
        if (marker.isValid()) {
          followingMarkerIndex = markerIndex;
          if (marker.getBufferRange().start.isGreaterThanOrEqual(changeEnd)) {
            break;
          }
        } else {
          this.markers[markerIndex] = this.recreateMarker(marker);
        }
        markerIndex++;
        marker = this.markers[markerIndex];
      }

      if (precedingMarkerIndex >= 0) {
        spliceStart = precedingMarkerIndex;
        scanStart = this.markers[precedingMarkerIndex].getBufferRange().start;
      } else {
        spliceStart = 0;
        scanStart = Point.ZERO;
      }

      if (followingMarkerIndex >= 0) {
        spliceEnd = followingMarkerIndex;
        scanEnd = this.markers[followingMarkerIndex].getBufferRange().end;
      } else {
        spliceEnd = Infinity;
        scanEnd = Point.INFINITY;
      }

      let newMarkers = this.createMarkers(scanStart, scanEnd);
      let oldMarkers = this.markers.splice(spliceStart, (spliceEnd - spliceStart) + 1, ...newMarkers);
      for (let i = 0; i < oldMarkers.length; i++) {
        let oldMarker = oldMarkers[i];
        oldMarker.destroy();
      }
      markerIndex += newMarkers.length - oldMarkers.length;
    }

    let marker = this.markers[++markerIndex];
    while (marker) {
      if (!marker.isValid()) {
        this.markers[markerIndex] = this.recreateMarker(marker);
      }
      marker = this.markers[++markerIndex];
    }

    this.emitter.emit("did-update", this.markers.slice());
    // this.patch.clear();
    this.currentResultMarker = null;
    return this.setCurrentMarkerFromSelection();
  }

  setCurrentMarkerFromSelection() {
    let marker = null;
    if (this.editor !== null) {
      marker = this.findMarker(this.editor.getSelectedBufferRange());
    }
    if (marker === this.currentResultMarker) {
      return;
    }

    if (this.currentResultMarker !== undefined) {
      this.resultsLayerDecoration.setPropertiesForMarker(this.currentResultMarker, null);
      this.currentResultMarker = null;
    }
    if (marker && !marker.isDestroyed()) {
      this.resultsLayerDecoration.setPropertiesForMarker(marker, {type: 'highlight', class: 'current-result'});
      this.currentResultMarker = marker;
    }

    this.emitter.emit('did-change-current-result', this.currentResultMarker);
  }

  findMarker(range) {
    if (__guard__(this.markers, x => x.length) > 0) {
      return this.resultsMarkerLayer.findMarkers({startPosition: range.start, endPosition: range.end})[0];
    }
  }
  recreateMarker(marker) {
    marker.destroy();
    this.createMarker(marker.getBufferRange());
  }
  createMarker(range) {
    let marker = this.resultsMarkerLayer.markRange(range, {invalidate: 'inside'});
    return marker;
  }
  bufferChanged({oldRange, newRange, newText}) {
    this.patch.splice(
      oldRange.start,
      oldRange.getExtent(),
      newRange.getExtent(),
      newText
    );
  }

}
