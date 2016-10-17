# TODO

- drag-and-drop reordering of headings
  - On mousedown, create UI element that will follow mouse (shadow copy of tree node or something)
  - As you drag, show UI to indicate where selection will land
  - To change text, on mouse drop (although could start process as soon as start drag):
    - Cut text from treenode range start to end
    - From item list, figure out which node you are dropping after > ideally should be able to get the TreeNode.item
    - paste text at prevnode.end
    - re-parse the document to refresh the tree
