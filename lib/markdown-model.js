const {Point, Range} = require('atom');
const {Parser} = require('commonmark');

const {AbstractModel} =require('./abstract-model');

const HEADING_REGEX = /(^#+)[^#](.*)#*\n|(^[^\n]+)\n(=+|-+)\n/g;

/**
 * @param  {String} src   The source file with YFM
 * @param  {Object} delim Change delimiters with delim.start|delim.end
 * @return {String}       Content of the file, sans YFM
 */
class MarkdownModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
  }

  stripYaml(src) {
    let regex = /^---\n(?:\s*)?([\s\S]*?)\n?^(---|\.\.\.)\s*$\n\n?/m;
    let match = regex.exec(src);
    let yamlLineCount = 0;

    if (this.buffer.findSync) {
      let range = this.buffer.findSync(regex);
      if (range && range.start.row === 0) {
        yamlLineCount = range.end.row;
      }
    }
    // TODO support fallback
    if (match && match.index === 0) {
      return {src: src.replace(regex, ''), len: yamlLineCount};
    }
    return {src: src, len: yamlLineCount};
  }

  /*
  * Completly override parse for markdown, prefer to use commonmark parser
  */
  parse() {
    let text = this.buffer.getText();

    // TODO maybe optionally disable this
    let rez = this.stripYaml(text);
    text = rez.src;
    this.yamlLineCount = rez.len;
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
          start = new Point(node.sourcepos[0][0] + this.yamlLineCount, node.sourcepos[0][1]);
          headingEnd = new Point(node.sourcepos[1][0] + this.yamlLineCount, node.sourcepos[1][1]);
          headingText = '';

          heading = {
            level: node.level,
            headingRange: new Range(start, headingEnd),
            plainText: '',
            children: [],
            range: new Range(start, Point.INFINITY),
            startPosition: start,
            endPosition: Point.INFINITY
          };

          rawHeadings.push(heading);
        } else {
          inHeading = false;
          heading.plainText = headingText;
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
module.exports = {MarkdownModel};
