'use babel';
/* eslint-env node, browser, jasmine */

import fs from 'fs';
import path from 'path';

import DocumentOutlineView from '../lib/document-outline-view';
import MockModel from '../lib/mock-model';

describe('DocumentOutlineView', () => {
  it('Creates a new view object', () => {
    let src = path.join(__dirname, "..", "spec", "test.json");
    // let src = 'atom://document-outline/spec/test.json';
    let editor;
    let openFilePromise = atom.workspace.open(path.join(__dirname, "..", "spec", 'test.md'));

    openFilePromise.then(ed => {
      editor = ed;
      editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm'));
      let mockHeadings = JSON.parse(fs.readFileSync(src));
      let mockModel = new MockModel(mockHeadings.headings);
      let view = new DocumentOutlineView(editor, mockModel);
      expect(view).toExist();
    });
  });
});
