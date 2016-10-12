'use babel';

import DocumentOutline from '../lib/document-outline';
import mdParse from '../lib/markdown-parse';
import path from 'path';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('DocumentOutline', () => {
  let editor, workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('document-outline');
  });

  describe('when the document-outline:toggle event is triggered', () => {
    it('should parse the markdown file', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      // expect(workspaceElement.querySelector('.markdown-outline')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      let filePath =  path.join(__dirname, "..", "spec", 'test.md')
      let buffer
      atom.commands.dispatch(workspaceElement, 'document-outline:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      let openFilePromise = atom.workspace.open(filePath);
      openFilePromise.then(ed => {
        editor = ed;
        editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm'));
      });

      waitsForPromise(() => {
          return openFilePromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.document-outline')).toExist();
        let markdownOutlineElement = workspaceElement.querySelector('.document-outline');
        expect(markdownOutlineElement).toExist();

        // let markdownOutlinePanel = atom.workspace.panelForItem(markdownOutlineElement);
        // expect(markdownOutlinePanel.isVisible()).toBe(true);

        // atom.commands.dispatch(workspaceElement, 'markdown-outline:toggle');
        // for now, logging should be triggered here
        // expect(markdownOutlinePanel.isVisible()).toBe(false);
      });
    });
    //
    // it('hides and shows the view', () => {
    //   // This test shows you an integration test testing at the view level.
    //
    //   // Attaching the workspaceElement to the DOM is required to allow the
    //   // `toBeVisible()` matchers to work. Anything testing visibility or focus
    //   // requires that the workspaceElement is on the DOM. Tests that attach the
    //   // workspaceElement to the DOM are generally slower than those off DOM.
    //   jasmine.attachToDOM(workspaceElement);
    //
    //   expect(workspaceElement.querySelector('.markdown-outline')).not.toExist();
    //
    //   // This is an activation event, triggering it causes the package to be
    //   // activated.
    //   atom.commands.dispatch(workspaceElement, 'markdown-outline:toggle');
    //
    //   waitsForPromise(() => {
    //     return activationPromise;
    //   });
    //
    //   runs(() => {
    //     // Now we can test for view visibility
    //     let markdownOutlineElement = workspaceElement.querySelector('.markdown-outline');
    //     expect(markdownOutlineElement).toBeVisible();
    //     atom.commands.dispatch(workspaceElement, 'markdown-outline:toggle');
    //     expect(markdownOutlineElement).not.toBeVisible();
    //   });
    // });
  });
});
