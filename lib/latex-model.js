'use babel';
import AbstractModel from './abstract-model';

const H1_REGEX = /^(\\part\*?){([^}]*)/;
const H2_REGEX = /^(\\chapter\*?){([^}]*)/;
const H3_REGEX = /^(\\section\*?){([^}]*)/;
const H4_REGEX = /^(\\subsection\*?){([^}]*)/;
const H5_REGEX = /^(\\subsubsection\*?){([^}]*)/;
const H6_REGEX = /^(\\paragraph\*?){([^}]*)/;
const H7_REGEX = /^(\\subparagraph\*?){([^}]*)/;

const HEADING_REGEXES = [H1_REGEX, H2_REGEX, H3_REGEX, H4_REGEX, H5_REGEX, H6_REGEX, H7_REGEX];

let COMBO_REGEX = '';
for (let regex of HEADING_REGEXES) {
  COMBO_REGEX = COMBO_REGEX + '(' + regex.source + ')|';
}

const HEADING_REGEX = new RegExp(COMBO_REGEX.slice(0, -1), 'g');

// const HEADING_REGEX = /(\\((sub)*)section\*?){(.*)}/g;
export default class LatexModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
    // Because 'part' is considered as level -1, increase the max depth
    // to get expected result
    this.maxDepth += 1;
  }

  getRegexData(scanResult) {
    let level = 0;
    let label = '';
    let heading = scanResult.match[0];
    for (let regex of HEADING_REGEXES) {
      let subresult = regex.exec(heading);
      level += 1;
      if (subresult) {
        label = subresult[2];
        break;
      }
    }

    return {
      level: level,
      label: label
    };
  }
}
