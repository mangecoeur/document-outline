'use babel';
/* eslint-env node, browser, jasmine */

const {TextBuffer} = require('atom');
const {ReStructuredTextModel} = require('../lib/rst-model');
const path = require('path');
const fs = require('fs');

var testText = `=========================================
ReStructuredText (rst): plain text markup
=========================================

.. sectnum::

.. contents:: The tiny table of contents

What is reStructuredText?
~~~~~~~~~~~~~~~~~~~~~~~~~

An easy-to-read, what-you-see-is-what-you-get plaintext markup syntax
and parser system, abbreviated *rst*. In other words, using a simple
text editor, documents can be created which

- are easy to read in text editor and
- can be *automatically* converted to

  - html and
  - latex (and therefore pdf)

What is it good for?
~~~~~~~~~~~~~~~~~~~~

reStructuredText can be used, for example, to

- write technical documentation (so that it can easily be offered as a
  pdf file or a web page)

- create html webpages without knowing html

- to document source code
`;

describe('ReStructuredTextModel', () => {
  describe('when we run rst pass on a text buffer', () => {
    it('should parse the rst text', () => {
      let buffer = new TextBuffer(testText);

      let model = new ReStructuredTextModel(buffer);
      let headings = model.parse();
      expect(headings.length).toEqual(1);
      expect(headings[0].children.length).toEqual(2);
    });
    it('should parse a rst file text', () => {
      let src = path.join(__dirname, "..", "spec", "test.rst");
      // let src = 'atom://document-outline/spec/test.json';

      let testText = fs.readFileSync(src, "utf8");
      let buffer = new TextBuffer(testText);

      let model = new ReStructuredTextModel(buffer);
      let headings = model.parse();
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].children.length).toBeGreaterThan(0);
    });
  });
});
