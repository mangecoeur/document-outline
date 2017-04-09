'use babel';
/* eslint-env node, browser, jasmine */

import {TextBuffer} from 'atom';
import LatexModel from '../lib/latex-model';
import path from 'path';
import fs from 'fs';

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
  describe('when we run latex pass on a text buffer', () => {
    it('should parse a latex file text', () => {
      let src = path.join(__dirname, "..", "spec", "test.latex");
      // let src = 'atom://document-outline/spec/test.json';

      let testText = fs.readFileSync(src, "utf8");
      let buffer = new TextBuffer(testText);

      let model = new LatexModel(buffer);
      let headings = model.parse();
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0].children.length).toBeGreaterThan(0);

    });
  });
});
