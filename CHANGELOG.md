## 2.1.1
* Added option to auto collapse the outline

## 2.1.0
* Change the outline styling to use syntax colors like atom-ide outline
* Improve contrast of currently selected outline
* Icon for outline pane
* Fix for issue #58 - return focus to editor after clicking heading


## 2.0.0
* Changed outline view to use virtual dom for more consistent performance
* Support the outline view in Atom IDE
* Misc bug fixes

## 1.7.0
* Misc bug fixes
* Only support latest versions of Atom

## 1.6.2

* Speed up Latex parsing by using (experimental) native buffer search, also improve performance in fallback mode.

## 1.6.1

* Allow heading tags in latex

## 1.6.0

* Converted to use Docks

## 1.5.0

* more options for highlighting and scrolling

## 1.4.7

* Don't generate items for commented out latex headings

## 1.4.6

* Improve performance while highlighting

## 1.4.3

* Fix for latex/beamer handling #17

## 1.4.2

* Remember the outline width between documents
* Improved fix for editor slowdown over time issue

## 1.4.0

* Added basic ASCIIDOC support
* Improved performance (lower memory)
* Fixes for slow-down over time under certain conditions

## 1.3.0

* Use commonmark to do proper parsing of markdown headings.

## 1.2.1

* Revert requirement for blank line after heading

## 1.2.0

* Added support for Setext headers (@komeda-shinji )
* Added support for RST files (@komeda-shinji)

## 1.1.3

* Fixes for some memory leaks

## 1.1.1

* Nicer auto-scroll of outline

## 1.1

* More robust handling of header nesting
* Better handling of Latex header hierarchy
