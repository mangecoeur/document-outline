'use babel';
import AbstractModel from './abstract-model';

// could just generate these...
const H1_REGEX = /(^#)[^#](.*)/g;
const H2_REGEX = /(^##)[^#](.*)/g;
const H3_REGEX = /(^###)[^#](.*)/g;
const H4_REGEX = /(^####)[^#](.*)/g;
const H5_REGEX = /(^#####)[^#](.*)/g;
const H6_REGEX = /(^######)[^#](.*)/g;
const H7_REGEX = /(^######)[^#](.*)/g;

// const HEADING_REGEX = [H1_REGEX, H2_REGEX, H3_REGEX, H4_REGEX, H5_REGEX, H6_REGEX, H7_REGEX];
const HEADING_REGEX = /(^#+)[^#](.*)/g;

export default class MarkdownModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }

  getRegexData(scanResult) {
    return {
      level: scanResult.match[1].length,
      label: scanResult.match[2]
    };
  }

}
