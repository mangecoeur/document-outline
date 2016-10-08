'use babel';
// import {Emitter} from 'event-kit';
// import _ from 'underscore-plus';
import {Point, Range, Emitter, CompositeDisposable} from 'atom';

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

const H1_REGEX = /(^#)[^#](.*)/g;
const H2_REGEX = /(^##)[^#](.*)/g;
const H3_REGEX = /(^###)[^#](.*)/g;
const H4_REGEX = /(^####)[^#](.*)/g;
const H5_REGEX = /(^#####)[^#](.*)/g;

const HEADING_REGEX = [H1_REGEX, H2_REGEX, H3_REGEX, H4_REGEX, H5_REGEX];
const MAX_HEADING_DEPTH = 3; // TODO make this configurable

let ResultsMarkerLayersByEditor = new WeakMap();

export default class MarkdownParse {
  constructor(buffer) {
    this.emitter = new Emitter();
    this.buffer = buffer;

    this.resultsMarkerLayer = this.resultsMarkerLayerForTextBuffer(this.buffer);
    this.subscriptions = null;
    this.markers = [];
    this.editor = null;
    // this.editor = this.buffer;
    this.headingBlocks = [];

    this.emitter.on('did-update', res => {console.log(res);});
    this.emitter.on('did-error', res => {console.log(res);});

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
      this.subscriptions.add(this.editor.buffer.onDidStopChanging(this.processAll.bind(this)));
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
          label: scanResult.matchText,
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
      if (level <= MAX_HEADING_DEPTH) {
        if (headingBlocks.length > 1) {
          let lastBlock = headingBlocks[headingBlocks.length - 1];
          let subLevel = this.processLevel(lastBlock.start,
                                         lastBlock.end,
                                         lastBlock.level + 1);
          lastBlock.children = subLevel;
        }
      }
    } catch (error) {
          // error.message = "Search string is too large" if /RegExp too big$/.test(error.message)
      this.emitter.emit('did-error', error);
      return false;
    }

    return headingBlocks;
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

}
