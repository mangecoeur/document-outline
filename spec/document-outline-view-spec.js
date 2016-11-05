'use babel';
/* eslint-env node, browser, jasmine */

import fs from 'fs';
import path from 'path';

import DocumentOutlineView from '../lib/document-outline-view';

describe('DocumentOutlineView', () => {
  it('has one valid test', () => {
    let src = path.join(__dirname, "..", "spec", "test.json");
    // let src = 'atom://document-outline/spec/test.json';

    let model = JSON.parse(fs.readFileSync(src));
    let view = new DocumentOutlineView(model);
    expect(view).not.toBeNull();
  });
});
