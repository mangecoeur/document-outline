'use babel';
/* eslint-env node, browser, jasmine */

import {TextBuffer} from 'atom';
import MarkdownModel from '../lib/markdown-model';
import path from 'path';
import fs from 'fs';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

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

  // beforeEach(() => {
  //   workspaceElement = atom.views.getView(atom.workspace);
  //   activationPromise = atom.packages.activatePackage('markdown-outline');
  // });

  describe('when we run markdown pass on a text buffer', () => {
    it('should parse the markdown text', () => {

      let buffer = new TextBuffer(testText);

      let model = new MarkdownModel(buffer);
      console.log(model.headings);
      expect(model.headings.length).toBeGreaterThan(0);
      expect(model.headings.length).toEqual(2);
      expect(model.headings[0].length).toEqual(3);

    });
    it('should parse a markdown file text', () => {
      let src = path.join(__dirname, "..", "spec", "longtext.md");
      // let src = 'atom://document-outline/spec/test.json';

      let testText = fs.readFileSync(src, "utf8");
      let buffer = new TextBuffer(testText);

      let model = new MarkdownModel(buffer);

      expect(model.headings.length).toBeGreaterThan(0);
      console.log(model.headings);
      expect(model.headings[0].children.length).toBeGreaterThan(0);

    });
  });
});
