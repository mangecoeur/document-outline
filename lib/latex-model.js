'use babel';
import AbstractModel from './abstract-model';

// could just generate these...
const H1_REGEX = /(\\section){(.*)}/g;
const H2_REGEX = /(\\subsection){(.*)}/g;
const H3_REGEX = /(\\subsubsection){(.*)}/g;
const H4_REGEX = /(\\subsubsubsection){(.*)}/g;

const HEADING_REGEX = [H1_REGEX, H2_REGEX, H3_REGEX, H4_REGEX];

export default class LatexModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }
}
