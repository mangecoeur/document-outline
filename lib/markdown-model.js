'use babel';
import {Point, Range} from 'atom';
import {Parser} from 'commonmark';

import AbstractModel from './abstract-model';

const HEADING_REGEX = /(^#+)[^#](.*)#*\n|(^[^\n]+)\n(=+|-+)\n/g;


/**
 * @param  {String} src   The source file with YFM
 * @param  {Object} delim Change delimiters with delim.start|delim.end
 * @return {String}       Content of the file, sans YFM
 */
function stripYaml(src, delim) {

  let re = /^---\n(?:\s*)?([\s\S]*)?\n?^(---|\.\.\.)\s*$\n\n?/mU;
  return src.replace(re, '');
}

export default class MarkdownModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }

  /*
  * Completly override parse for markdown, prefer to use commonmark parser
  */
  parse() {
    let text = this.buffer.getText();
    // TODO maybe optionally disable this
    text = stripYaml(text);
    let reader = new Parser();
    let parsed = reader.parse(text);
    let rawHeadings = this.getHeadings(parsed);
    return this._stackHeadings(rawHeadings);
  }

  getHeadings(parsed) {
    let walker = parsed.walker();
    let event;
    let node;
    let heading;
    let headingText = '';
    let start;
    let headingEnd;
    let rawHeadings = [];
    let inHeading = false;

    while ((event = walker.next())) {
      node = event.node;
      if (node.type === 'heading') {
        // With commonmark, headings are split into heading node and child text nodes
        // Since there might be several children (e.g. emph or Tex), accumulate the text literal
        // up to the heading close
        if (event.entering) {
          inHeading = true;
          // sourcepos: an Array with the following form: [[startline, startcolumn], [endline, endcolumn]]
          start = new Point(node.sourcepos[0][0], node.sourcepos[0][1]);
          headingEnd = new Point(node.sourcepos[1][0], node.sourcepos[1][1]);
          headingText = '';

          heading = {
            level: node.level,
            headingRange: new Range(start, headingEnd),
            label: '',
            children: [],
            range: new Range(start, Point.INFINITY)
          };

          rawHeadings.push(heading);
        } else {
          inHeading = false;
          heading.label = headingText;
        }
      } else if (inHeading) {
        // Make sure we only add the literal if it's not null #29
        if (node.literal) {
          headingText += node.literal;
        }
      }
    }
    return rawHeadings;
  }
}
