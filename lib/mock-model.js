'use babel';
import {Point, Range, Emitter} from 'atom';

export default class MockModel {
  // NOTE: if it was possible to simply scan through applied scopes, wouldn't need most of this...
  constructor(headings) {
    this.headings = headings;
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
    this.emitter.emit("did-update", this.headings);
  }

  parse() {
    return this.headings;
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
