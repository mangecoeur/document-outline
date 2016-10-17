# Document Outline
A short description of your package.

![A screenshot of your package](https://f.cloud.github.com/assets/69169/2290250/c35d867a-a017-11e3-86be-cd7c5bf3ff9b.gif)


## TODO

- update outline to parse current document when switching between markdown editors but make sure it stays hidden at other times
- fix heading highlighting
  - clear current when selecting other
  - animate/fadeout highlight

- drag-and-drop reordering of headings
  - On mousedown, create UI element that will follow mouse (shadow copy of tree node or something)
  - As you drag, show UI to indicate where selection will land
  - To change text, on mouse drop (although could start process as soon as start drag):
    - Cut text from treenode range start to end
    - From item list, figure out which node you are dropping after > ideally should be able to get the TreeNode.item
    - paste text at prevnode.end
    - re-parse the document to refresh the tree
