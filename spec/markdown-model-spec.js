'use babel';
/* eslint-env node, browser, jasmine */

const {TextBuffer} = require('atom');
const {MarkdownModel} = require('../lib/markdown-model');
const path = require('path');
const fs = require('fs');

var testText = `# first h1

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## first h2

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Heading 3

some text

## Heading 2

Also text

# Second h1

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Second H2

Second h2 paragraph...

`;

describe('MarkdownModel', () => {
  describe('when we run markdown pass on a text buffer', () => {
    it('should parse the markdown text', () => {
      let buffer = new TextBuffer(testText);

      let model = new MarkdownModel(buffer);
      let headings = model.parse();
      expect(headings.length).toEqual(2);
      expect(headings[0].children.length).toEqual(2);
    });
    it('should parse a markdown file text', () => {
      let src = path.join(__dirname, "..", "spec", "longtext.md");
      // let src = 'atom://document-outline/spec/test.json';

      let testText = fs.readFileSync(src, "utf8");
      let buffer = new TextBuffer(testText);

      let model = new MarkdownModel(buffer);
      let headings = model.parse();
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].children.length).toBeGreaterThan(0);
    });
  });
});
