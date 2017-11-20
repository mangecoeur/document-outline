'use babel';
/* eslint-env node, browser, jasmine */

import {TextBuffer} from 'atom';
import PythonModel from '../lib/python-model';
import path from 'path';
import fs from 'fs';

var testText = `
def fn1(self, something, some_class):
  pass

class T:
  def fn2(self):
    pass

class asdf (object):
  pass
`;

describe('PythonModel', () => {
  describe('when we run python pass on a text buffer', () => {
    it('should parse the python text', () => {
      let buffer = new TextBuffer(testText);

      let model = new PythonModel(buffer);
      let headings = model.parse();
      expect(headings.length).toEqual(3);
      expect(headings[1].children.length).toBeGreaterThan(0);
    });
  });
});
