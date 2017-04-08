'use babel';
import AbstractModel from './abstract-model';

const HEADING_REGEX = /^(.+)\n([!-/:-@[-`{-~])\2+$/g;

var sectionLevels = {};

export default class reStructuredTextModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }

  getRegexData(scanResult) {
    var lv = 1;
    var c = scanResult.match[2].substr(0, 1);
    if (c in sectionLevels) {
      lv = sectionLevels[c];
    } else {
      lv = Object.keys(sectionLevels).length + 1;
      sectionLevels[c] = lv;
    }
    return {
      level: lv,
      label: scanResult.match[1]
    };
  }

}
