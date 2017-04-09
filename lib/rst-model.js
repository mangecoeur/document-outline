'use babel';
import AbstractModel from './abstract-model';

const HEADING_REGEX = /^(.+)\n([!-/:-@[-`{-~])\2+$/g;

export default class ReStructuredTextModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
    this.sectionLevels = {};
  }

  getRegexData(scanResult) {
    let level = 1;
    let c = scanResult.match[2].substr(0, 1);

    // Sometimes sectionLevels not set. Shouldn't happen but cant be bother to figure out why it does
    if (this.sectionLevels === undefined) {
      this.sectionLevels = {};
    }

    if (c in this.sectionLevels) {
      level = this.sectionLevels[c];
    } else {
      level = Object.keys(this.sectionLevels).length + 1;
      this.sectionLevels[c] = level;
    }
    return {
      level: level,
      label: scanResult.match[1]
    };
  }

}
