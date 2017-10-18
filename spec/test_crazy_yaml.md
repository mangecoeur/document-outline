---
header-includes:
  - <!-- remap unsupported unicode chars -->
  - \usepackage{newunicodechar}
  - \newunicodechar{✅}{✔}
  - \newunicodechar{❌}{✘}

  - <!-- define titlepage as cover, see KOMA Script manual p. 296 -->
  - \KOMAoptions{titlepage = firstiscover}

  - <!-- avoid period after table/figure (and chapter/section etc.) number, see KOMA Script manual p. 103f or <https://tex.stackexchange.com/questions/29181/figure-and-table-numbers-in-caption-are-terminated-by-a-period-and-semicolon> -->
  - \KOMAoptions{numbers = noendperiod}

  - <!-- customize chapter font (H1) -->
  - \addtokomafont{chapter}{\scshape}

  - <!-- change color of `inline code spans` -->
  - \usepackage[dvipsnames,table]{xcolor}
  - \definecolor{bckgrnd}{RGB}{248,248,248}
  - \let\OldTexttt\texttt
  - \renewcommand{\texttt}[1]{\OldTexttt{\color{Gray}{#1}}}

  - <!-- customize (syntax highlighted) code fences -->
  - \usepackage{fancyvrb}
  - \DefineVerbatimEnvironment{Highlighting}{Verbatim}{
      commandchars = \\\{\},
      fontsize = \scriptsize,
      fontseries = l,
      baselinestretch = 1
    }
  - \DefineVerbatimEnvironment{verbatim}{Verbatim}{
      commandchars = \\\{\},
      fontsize = \scriptsize,
      fontseries = l,
      formatcom = \color{Gray},
      baselinestretch = 1
    }

  - <!-- customize footnotes -->
  - \deffootnote[3em]{3em}{0em}{\makebox[2em][l]{\textsuperscript\thefootnotemark}}
  - \setlength{\footnotesep}{1.2em}
  - \setlength{\skip\footins}{1.8em}
  - \setlength{\footskip}{22pt}

  - <!-- customize header and footer -->
  - \pagestyle{headings}
  - \usepackage{scrlayer-scrpage}
  - \KOMAoptions{headsepline = on}
  - \KOMAoptions{footsepline = on}
  - \KOMAoptions{plainfootsepline = on}
  - \addtokomafont{pageheadfoot}{\normalfont\small}
  - \addtokomafont{pagenumber}{\small}
  - \ModifyLayer[addvoffset = 3pt]{scrheadings.head.below.line}
  - \ModifyLayer[addvoffset = 3pt]{plain.scrheadings.head.below.line}

  - <!-- customize table and figure layout and appearance -->
  - \usepackage{chngcntr}
  - \counterwithout{table}{chapter}
  - \counterwithout{figure}{chapter}
  - \usepackage[margins = raggedright]{floatrow}
  - \renewcommand{\arraystretch}{1.5}
  - \definecolor{lightgray}{gray}{0.95}
  - \let\OldLongtable\longtable
  - \let\OldEndLongtable\endlongtable
  - \renewenvironment{longtable}{\singlespace\footnotesize\OldLongtable}{\OldEndLongtable}
  - \KOMAoptions{captions=nooneline}
  - \usepackage[
      font = normalsize,
      labelfont = {normalsize,sc},
      justification = justified,
      format = plain
    ]{caption}
  - \usepackage[section]{placeins}
---


# H1-1

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla

bla


# H1-2

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup

blup


# H1-3

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing

boing


## H2-1

and

and

and

and

and

and

and

and

and

and

and

and

and

and

and

and

and

and

## H2-2

so

so

so

so

so

so

so

so

so

so

so

so

so

so

so

so

so

so

so

so

so

## H2-3

on

on

on

on

on

on

on

on

on

on

on

on

on

on

on

on

on

on

on

on

on


# H1-4

lala

lala

lala

lala

lala

lala

lala

lala

# H1-5

la

la

la

la

la

la

la

# H1-6

la

la

la

la

la

la

la

la
