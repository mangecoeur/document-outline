'use babel';
import AbstractModel from './abstract-model';

const H1_REGEX = /(\\section){(.*)}/g;
const H2_REGEX = /(\\subsection){(.*)}/g;
const H3_REGEX = /(\\subsubsection){(.*)}/g;
const H4_REGEX = /(\\subsubsubsection){(.*)}/g;

// const HEADING_REGEX = [H1_REGEX, H2_REGEX, H3_REGEX, H4_REGEX];
const HEADING_REGEX = /(\\((sub)*)section){(.*)}/g;
export default class LatexModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }

  getRegexData(scanResult) {
    return {
      level: Math.floor(scanResult.match[2].length / 3),
      label: scanResult.match[4]
    };
  }
}
