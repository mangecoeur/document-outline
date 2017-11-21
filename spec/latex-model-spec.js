/* eslint-env node, browser, jasmine */

const {TextBuffer} = require('atom');
const {LatexModel} = require('../lib/latex-model');
const path = require('path');
const fs = require('fs');

// Need String.raw to use literal backslash character.
var testText = String.raw`
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

var testPartialVsPart = String.raw`
\part[filler text]{Part name}
$\partial x$
$\partial{x}$
`;

describe('LatexModel', () => {
  describe('when we run latex pass on a text buffer', () => {
    it('should parse the latex text', () => {
      let buffer = new TextBuffer(testText);

      let model = new LatexModel(buffer);
      let headings = model.parse();
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].children.length).toBeGreaterThan(0);
    });
    it('should parse a latex file text', () => {
      let src = path.join(__dirname, "..", "spec", "test.tex");
      // let src = 'atom://document-outline/spec/test.json';

      let testText = fs.readFileSync(src, "utf8");
      let buffer = new TextBuffer(testText);

      let model = new LatexModel(buffer);
      let headings = model.parse();
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].children.length).toBeGreaterThan(0);

    });
  });
  describe('when we run latex pass on a text buffer containing the \\partial command', () => {
    it('should ignore any \\partial when creating headings', () => {
      let buffer = new TextBuffer(testPartialVsPart);
      let model = new LatexModel(buffer);
      let headings = model.parse();

      expect(headings.length).toEqual(1);
      expect(headings[0].children.length).toEqual(0);
    });
  });
});
