/* eslint-env node, browser, jasmine */

const path = require('path');

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
      let filePath = path.join(__dirname, "..", "spec", 'test.md');

      waitsForPromise(() => {
        return activationPromise;
      });

      let openFilePromise = atom.workspace.open(filePath);
      openFilePromise.then(ed => {
        editor = ed;
        editor.setGrammar(atom.grammars.grammarForScopeName('source.gfm'));

        let toggle = atom.commands.dispatch(workspaceElement, 'document-outline:toggle');
        toggle.then(() => {
          expect(workspaceElement.querySelector('.document-outline')).toExist();
        });
      });
    });
  });
});
