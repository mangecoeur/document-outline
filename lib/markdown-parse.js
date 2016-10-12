'use babel';
// import {Emitter} from 'event-kit';
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
  constructor(editorOrBuffer) {
    this.emitter = new Emitter();
    this.subscriptions = new CompositeDisposable();

    if (editorOrBuffer.getBuffer) {
      this.buffer = editorOrBuffer.getBuffer();
      this.editor = editorOrBuffer;
    } else {
      this.buffer = editorOrBuffer;
      this._editor = null;
    }

    this.resultsMarkerLayer = this.resultsMarkerLayerForTextBuffer(this.buffer);

    this.subscriptions.add(this.buffer.onDidStopChanging(this.parseAll.bind(this)));

    this.markers = [];
    // this.editor = this.buffer;
    this.headingBlocks = [];

    // this.emitter.on('did-update', res => {console.log(res);});
    this.emitter.on('did-error', res => {
      console.log('error');
      console.log(res);
    });

    this.parseAll();
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
  set editor(editor) {
    this._editor = editor;
    this.subscriptions.dispose();
    if (this._editor & this._editor.getBuffer) {
      this.buffer = this._editor.getBuffer();
      this.subscriptions.add(this.buffer.onDidStopChanging(this.parseAll.bind(this)));
      this.resultsMarkerLayer = this.resultsMarkerLayerForTextBuffer(this.buffer);
      // this.resultsLayerDecoration.destroy();
      this.resultsLayerDecoration = this._editor.decorateMarkerLayer(this.resultsMarkerLayer,
                                                                    {type: 'highlight',
                                                                     class: 'document-section'});
      this.parseAll();

    }
  }

  get editor() {
    return this._editor;
  }

  resultsMarkerLayerForTextBuffer(buffer) {
    let layer = ResultsMarkerLayersByEditor.get(buffer);
    if (!layer) {
      layer = buffer.addMarkerLayer({maintainHistory: false});
      ResultsMarkerLayersByEditor.set(buffer, layer);
    }
    return layer;
  }

  // resultsMarkerLayerForTextEditor(editor) {
  //   let layer = ResultsMarkerLayersByEditor.get(editor);
  //   if (!layer) {
  //     layer = editor.addMarkerLayer({maintainHistory: false});
  //     ResultsMarkerLayersByEditor.set(editor, layer);
  //   }
  //   return layer;
  // }

  destroy() {
    this.subscriptions.dispose();
  }

  // ###
  // Section Private
  // ###

  parseAll() {
    this.headingBlocks = this.parseLevel(Point.ZERO, Point.INFINITY, 1);
    this.emitter.emit("did-update", this.headingBlocks.slice());
    return this.headingBlocks;
  }

  /**
   * create markers at level, where level is in {1, 2, 3} for h1, h2, h3
   * @return
   */
  parseLevel(start, end, level) {
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
          label: scanResult.match[2],
          children: []
        };


        if (headingBlocks.length > 0) {
          // update the previous heading block at this level if there is one...
          let prevBlock = headingBlocks[headingBlocks.length - 1];
          prevBlock.end = currentBlock.start; // TODO might need to tweak end to be non-inclusive...

          if (level <= MAX_HEADING_DEPTH) {
            let subLevel = this.parseLevel(prevBlock.start,
                                             prevBlock.end,
                                             prevBlock.level + 1);
            prevBlock.children = subLevel;
          }
        } else {
          if (level <= MAX_HEADING_DEPTH) {
            let subLevel = this.parseLevel(currentBlock.start,
                                             end,
                                             level + 1);
            currentBlock.children = subLevel;
          }
          // console.log(currentBlock);
        }

        // TODO actually should only process the PREVIOUS one because otherwise the end will not be set
        // however kinda need to process this one even if it means duplicating because not sure how to do last block otherwise
        // if (level <= MAX_HEADING_DEPTH) {
        //   let subLevel = this.parseLevel(currentBlock.start,
        //                                    currentBlock.end,
        //                                    currentBlock.level + 1);
        //   currentBlock.children = subLevel;
        // }
        // TODO how to make sure the last block gets processed?
        // maybe super inefficient, but for now could just process twice,
        // once assuming till end which gets overridden in the next iter
        headingBlocks.push(currentBlock);
      });

      //TODO would prefer it this way,but if we do it in callback should at least guarantee to be run with async...
      // for (var i = 1; i < headingBlocks.length; i++) {
      //   let prevBlock = headingBlocks[i - 1];
      //   let thisBlock = headingBlocks[i];
      //   prevBlock.end = thisBlock.start;
      // }

      // TODO for now process the last block outside of 'loop' though problem is not sure it will be ready...
      if (level <= MAX_HEADING_DEPTH) {
        if (headingBlocks.length > 1) {
          let lastBlock = headingBlocks[headingBlocks.length - 1];
          let subLevel = this.parseLevel(lastBlock.start,
                                         end,
                                         lastBlock.level + 1);
          lastBlock.children = subLevel;
        }
      }

      // In case there are no results for this level, want to add an empty holder and try the next level down
      if (headingBlocks.length === 0) {
        headingBlocks = this.parseLevel(start, end, level + 1);
      }
    } catch (error) {
          // error.message = "Search string is too large" if /RegExp too big$/.test(error.message)
      console.log(error);
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
