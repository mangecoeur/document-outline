'use babel';
/* eslint-env node, browser, jasmine */

import {TextBuffer} from 'atom';
import LatexModel from '../lib/latex-model';
import path from 'path';
import fs from 'fs';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

var testText = `
\chapter{Introduction}

This chapter's content...

\section{Heading1}

Si marmora omnes nympha arcuerat classe, quoque, Lucifer tanti, suos Ditis
fragosis; tardus? Natus at putatur subit ante Perseia certam pariter, deus
*aris*. Concita feci feratur Achelous sacrarunt vidistis agitur horrenda
pervenit, hic sensit, tellusAndros femineos miles feres fiat venis!

\subsection{Heading2}


Si marmora omnes nympha arcuerat classe, quoque, Lucifer tanti, suos Ditis
fragosis; tardus? Natus at putatur subit ante Perseia certam pariter, deus
*aris*. Concita feci feratur Achelous sacrarunt vidistis agitur horrenda
pervenit, hic sensit, tellusAndros femineos miles feres fiat venis!

\subsection{Heading2}


Si marmora omnes nympha arcuerat classe, quoque, Lucifer tanti, suos Ditis
fragosis; tardus? Natus at putatur subit ante Perseia certam pariter, deus
*aris*. Concita feci feratur Achelous sacrarunt vidistis agitur horrenda
pervenit, hic sensit, tellusAndros femineos miles feres fiat venis!

\subsubsection{Heading3}


Si marmora omnes nympha arcuerat classe, quoque, Lucifer tanti, suos Ditis
fragosis; tardus? Natus at putatur subit ante Perseia certam pariter, deus
*aris*. Concita feci feratur Achelous sacrarunt vidistis agitur horrenda
pervenit, hic sensit, tellusAndros femineos miles feres fiat venis!

\subsection{Heading2}

Si marmora omnes nympha arcuerat classe, quoque, Lucifer tanti, suos Ditis
fragosis; tardus? Natus at putatur subit ante Perseia certam pariter, deus
*aris*. Concita feci feratur Achelous sacrarunt vidistis agitur horrenda
pervenit, hic sensit, tellusAndros femineos miles feres fiat venis!

\section{Heading1}

`;

describe('LatexModel', () => {

  // beforeEach(() => {
  //   workspaceElement = atom.views.getView(atom.workspace);
  //   activationPromise = atom.packages.activatePackage('markdown-outline');
  // });

  describe('when we run latex pass on a text buffer', () => {
    // FIXME for some reason it doesn't like reading from the string
    // it('should parse the latex text', () => {
    //
    //   let buffer = new TextBuffer(testText);
    //   let model = new LatexModel(buffer);
    //   model.update();
    //
    //   console.log(model);
    //   expect(model.headings.length).toEqual(2);
    //   expect(model.headings[0].children.length).toEqual(2);
    //
    // });
    it('should parse a latex file text', () => {
      let src = path.join(__dirname, "..", "spec", "test.latex");
      // let src = 'atom://document-outline/spec/test.json';

      let testText = fs.readFileSync(src, "utf8");
      let buffer = new TextBuffer(testText);

      let model = new LatexModel(buffer);
      model.update();
      expect(model.headings.length).toBeGreaterThan(0);
      expect(model.headings[0].children.length).toBeGreaterThan(0);

    });
  });
});
