'use babel';
import AbstractModel from './abstract-model';

const CLASS_REGEX = /(class)\s+(\w+)\s*(:|\(([^\)]*))/;
const DEF_REGEX = /(def)\s+(\w+)\s*\(([^\)]*)/;

const HEADING_REGEXES = [CLASS_REGEX, DEF_REGEX];

let COMBO_REGEX = '';
for (let regex of HEADING_REGEXES) {
  // Join the regexes together, adding wildcard to match whole line, which lets
  // us detect '%' comment marks later
  COMBO_REGEX = COMBO_REGEX + '(.*' + regex.source + ')|';
}

const HEADING_REGEX = new RegExp(COMBO_REGEX.slice(0, -1), 'gm');

export default class PythonModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
    this.maxDepth += 1;
  }

  getRegexData(scanResult) {
    let level = 0;
    let label = '';
    let heading = scanResult[0];
    heading = heading.trim();
    // Skip result if line is commented out.
    if (heading.startsWith("#")) {
      return;
    }

    for (let regex of HEADING_REGEXES) {
      level += 1;
      if (level <= this.maxDepth) {
        let subresult = regex.exec(heading);
        if (subresult) {
          label = subresult[2];
          break;
        }
      }
    }

    return {
      level: level,
      label: label
    };
  }
}
