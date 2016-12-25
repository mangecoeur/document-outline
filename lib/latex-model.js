'use babel';
import AbstractModel from './abstract-model';

// could just generate these...
const H1_REGEX = /^(\\part\*?){([^}]*)/g;
const H2_REGEX = /^(\\chapter\*?){([^}]*)/g;
const H3_REGEX = /^(\\section\*?){([^}]*)/g;
const H4_REGEX = /^(\\subsection\*?){([^}]*)/g;
const H5_REGEX = /^(\\subsubsection\*?){([^}]*)/g;
const H6_REGEX = /^(\\paragraph\*?){([^}]*)/g;
const H7_REGEX = /^(\\subparagraph\*?){([^}]*)/g;

const HEADING_REGEX = [H1_REGEX, H2_REGEX, H3_REGEX, H4_REGEX, H5_REGEX, H6_REGEX, H7_REGEX];

export default class LatexModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }
}
