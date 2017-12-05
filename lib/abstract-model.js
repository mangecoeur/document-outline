const {Point, Range} = require('atom');

const MAX_HEADING_DEPTH = 4;

class AbstractModel {
  // NOTE: if it was possible to simply scan through applied scopes, wouldn't need most of this...
  constructor(editorOrBuffer, headingRegexes) {
    this.HEADING_REGEX = headingRegexes;
    if (editorOrBuffer.getBuffer) {
      editorOrBuffer = editorOrBuffer.getBuffer();
    }
    this.buffer = editorOrBuffer;

    // Use fast buffer search if it exists
    if (this.buffer.findAllSync) {
      this._parseLevel = this._parseLevelFast;
    } else {
      this._parseLevel = this._parseLevelSlow;
    }

    this.maxDepth = atom.config.get("document-outline.maxHeadingDepth");
    if (!this.maxDepth) {
      this.maxDepth = MAX_HEADING_DEPTH;
    }

    this.oldHeadingStr = '';
  }

  getOutline() {
    let newHeadings = this.parse();
    let newHeadingStr = JSON.stringify(newHeadings);
    if (newHeadingStr === this.oldHeadingStr) {
      return null;
    }
    this.oldHeadingStr = newHeadingStr;
    return newHeadings;
  }

  parse() {
    return this._parseLevel(Point.ZERO, Point.INFINITY, 1);
  }

  // abstact getRegexData(scanResult)

  /**
   * @param {List} rawHeadings - raw list of heading objects from parser
   * @return {List} - headings nested according to their level
   */
  _stackHeadings(rawHeadings) {
    let stack = [{
      level: 0,
      plainText: '_hidden_root',
      headingRange: new Range(Point.ZERO, Point.INFINITY),
      children: [],
      range: new Range(Point.ZERO, Point.INFINITY)
    }];
    let top;
    for (let heading of rawHeadings) {
      if (heading.level > this.maxDepth) {
        continue;
      }
      top = stack.pop();
      if (heading.level > top.level) {
        top.children.push(heading);
        stack.push(top);
        stack.push(heading);
      } else if (heading.level === top.level) {
        // At equal level, we close the previous heading
        // Create a new point to avoid re-use of mutable value
        top.range.end = new Point(heading.headingRange.start.row - 1, heading.headingRange.start.column);
        top.endPosition = top.range.end;
        // Then get the parent
        top = stack.pop();
        top.children.push(heading);
        stack.push(top);
        stack.push(heading);
      } else if (top.level > heading.level) {
        // This starts a new section at a more important level
        // roll up the stack
        // Create a new point to avoid re-use of mutable value
        top.range.end = new Point(heading.headingRange.start.row - 1, heading.headingRange.start.column);
        top.endPosition = top.range.end;
        while (top) {
          top = stack.pop();
          // Close each range until we get to the suitable parent
          // Create a new point to avoid re-use of mutable value
          top.range.end = new Point(heading.headingRange.start.row - 1, heading.headingRange.start.column);
          top.endPosition = top.range.end;
          if (top.level < heading.level) {
            break;
          }
        }
        top.children.push(heading);
        stack.push(top);
        stack.push(heading);
      }
    }
    return stack[0].children;
  }

  _parseLevelFast(start, end, level) {
    let rawHeadings = [];
    let regex = this.HEADING_REGEX;
    let ranges = this.buffer.findAllSync(regex);
    let headingText;
    // non global version of the heading regex
    // this is a backward compat hack that avoids changes to implementations
    // for each grammar.
    let limitedRegex = new RegExp(regex, 'm');
    for (let headingRange of ranges) {
      headingText = this.buffer.getTextInRange(headingRange);
      let result = limitedRegex.exec(headingText);
      // let parsedResult = this.getRegexData([headingText]);
      if (result) {
        let parsedResult = this.getRegexData(result);

        if (parsedResult) {
          let heading = {
            level: parsedResult.level,
            headingRange: headingRange,
            plainText: parsedResult.label,
            children: [],
            range: new Range(headingRange.start, Point.INFINITY),
            startPosition: headingRange.start,
            endPosition: Point.INFINITY
          };
          rawHeadings.push(heading);
        }
      }
    }
    return this._stackHeadings(rawHeadings);
  }

  // _parseLevel(start, end, level) {
  //   // TODO Don't really want to do this check every time. Better move into the init and put each implementation in its own function.
  //   if (this.buffer.findAllSync) {
  //     return this._parseLevelFast(start, end, level);
  //   } else {
  //     return this._parseLevelSlow(start, end, level);
  //   }
  // }

  _parseLevelSlow(start, end, level) {
    let rawHeadings = [];
    let regex = this.HEADING_REGEX;

    let text = this.buffer.getText();

    let results = [];
    let result;
    let parsedResult;
    // Collect the regex results
    while ((result = regex.exec(text)) !== null) {
      // allow subclasses to customise how they get level, label from regex
      parsedResult = this.getRegexData(result);
      if (parsedResult) {
        parsedResult.index = result.index;
        results.push(parsedResult);
      }
    }

    // Find the line numbers for the results
    // Much faster to loop over the lines once than to search every time.
    let currentResultIndex = 0;
    let currentResult = results[currentResultIndex];
    let line = 0;
    let match;
    let re = /(^.*(\r\n|\n\r|\n|\r))|(^\r\n|^\n\r|^\n|^\r)/gm;
    while ((match = re.exec(text))) {
      if (match.index > currentResult.index) {
        let startLine = line;
        let headingRange = new Range([startLine, 0],
                                     [startLine, currentResult.label.length]);
        let heading = {
          level: currentResult.level,
          headingRange: headingRange,
          plainText: currentResult.label,
          children: [],
          icon: 'icon-one-dot',
          range: new Range(headingRange.start, Point.INFINITY),
          startPosition: headingRange.start,
          endPosition: Point.INFINITY
        };

        rawHeadings.push(heading);
        currentResultIndex += 1;
        if (currentResultIndex >= results.length) {
          // Stop iterating if we did all the headings
          break;
        } else {
          currentResult = results[currentResultIndex];
        }
      }
      line += 1;
    }

    return this._stackHeadings(rawHeadings);
  }

}

module.exports = {AbstractModel};
