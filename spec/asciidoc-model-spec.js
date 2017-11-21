/* eslint-env node, browser, jasmine */

const {TextBuffer} = require('atom');
const {AsciiDocModel} = require('../lib/asciidoc-model');
const path = require('path');
const fs = require('fs');

var testText = `= The Article Title
Author's Name <authors@email.address>
v1.0, 2003-12


This is the optional preamble (an untitled section body). Useful for
writing simple sectionless documents consisting only of a preamble.

NOTE: The abstract, preface, appendix, bibliography, glossary and
index section titles are significant ('specialsections').


:numbered!:
[abstract]
== Example Abstract

The optional abstract (one or more paragraphs) goes here.

This document is an AsciiDoc article skeleton containing briefly
annotated element placeholders plus a couple of example index entries
and footnotes.

:numbered:

== The First Section

Article sections start at level 1 and can be nested up to four levels
deep.
footnote:[An example footnote.]
indexterm:[Example index entry]

And now for something completely different: ((monkeys)), lions and
tigers (Bengal and Siberian) using the alternative syntax index
entries.
(((Big cats,Lions)))
(((Big cats,Tigers,Bengal Tiger)))
(((Big cats,Tigers,Siberian Tiger)))
Note that multi-entry terms generate separate index entries.

`;

describe('AsciiDocTextModel', () => {
  describe('when we run adoc pass on a text buffer', () => {
    it('should parse the adoc text', () => {
      let buffer = new TextBuffer(testText);

      let model = new AsciiDocModel(buffer);
      let headings = model.parse();
      expect(headings.length).toEqual(1);
      expect(headings[0].children.length).toEqual(2);
    });
    it('should parse an adoc file text', () => {
      let src = path.join(__dirname, "..", "spec", "test.adoc");
      // let src = 'atom://document-outline/spec/test.json';

      let testText = fs.readFileSync(src, "utf8");
      let buffer = new TextBuffer(testText);

      let model = new AsciiDocModel(buffer);
      let headings = model.parse();
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].children.length).toBeGreaterThan(0);
    });
  });
});
