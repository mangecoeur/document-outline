'use babel';
/* eslint-env node, browser, jasmine */

import fs from 'fs';
import path from 'path';

import DocumentOutlineView from '../lib/document-outline-view';

describe('DocumentOutlineView', () => {
  it('has one valid test', () => {
    let src = path.join(__dirname, "..", "spec", "test.json");
    // let src = 'atom://document-outline/spec/test.json';
    let editor;
    let openFilePromise = atom.workspace.open(path.join(__dirname, "..", "spec", 'test.md'));

    openFilePromise.then(ed => {
      editor = ed;
      editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm'));
      let mockModel = JSON.parse(fs.readFileSync(src));
      mockModel.onDidUpdate = () => {};

      let view = new DocumentOutlineView(editor, mockModel);
      expect(view).not.toBeNull();
    });
  });
});
