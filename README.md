# Document Outline

Displays a hierarchical, interactive outline tree view of your document. This is particularly useful for working on long form documents such as academic papers and theses.

![screenshot of document-outline](https://raw.githubusercontent.com/mangecoeur/document-outline/master/document-outline-screenshot.png)

## Usage

Trigger using `document-outline:toggle` or enable `show by default` setting. Single click to jump to heading in document, double click to collapse sub-headings.

## See also

Some handy packages for working on long form markdown documents:

- [preview-inline](https://atom.io/packages/preview-inline) (shameless plug) allows quick inline previews of LaTeX math equations and images in documents without having to generate a preview
- [markdown preview plus](https://atom.io/packages/markdown-preview-plus) enhanced HTML preview of markdown documents
- [build](https://atom.io/packages/build) plus `build-makefile`. If you use Pandoc to build serious documents, your pandoc command starts to get pretty fancy. Do yourself a favour and write a makefile for that, then use atom-build to easily trigger building your document from the editor.

## TODO

- drag-and-drop reordering of headings
- section highlighting
- support for non-ATX headers in markdown
- support for other languages (priority LaTeX)
