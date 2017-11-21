function onDragStart(event) {
  console.log(event);
  event.dataTransfer.setData('text/html', null); // cannot be empty string
}

function onDragOver(event) {
  var counter = document.getElementById('dropzone');
  counter.innerText = parseInt(counter.innerText, 10) + 1;
  console.log(event);
}
let xOffset, yOffset;
class DocumentOutlineView {

  constructor(editor, docModel) {
    this.editor = editor;
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('document-outline');
    this.panel = atom.workspace.addRightPanel({item: this.element});

    let dragel = document.createElement('div');
    dragel.id = 'draggable';
    dragel.setAttribute('draggable', true);
    this.element.appendChild(dragel);
    console.log(dragel);

    let dropel = document.createElement('div');
    dropel.id = 'dropzone';
    dropel.setAttribute('dropzone', true);
    this.element.appendChild(dropel);

    // dragel.addEventListener('dragstart', onDragStart, false);
    dropel.addEventListener('dragover', onDragOver, false);

    let dropTarget;
    dropel.addEventListener('mouseover', event => {
      dropel.classList.add('highlight');
      event.stopPropagation();
      dropTarget = dropel;
    });

    // state 0=mouseup, 1=mousedown, 2=drag
    var state = 0;
  }

  // Tear down any state and detach
  destroy() {
    this.element.remove();
    this.panel.destroy();
  }

  getElement() {
    return this.element;
  }

  hide() {
    this.panel.hide();
  }

  show() {
    this.panel.show();
  }

  toggle() {
    if (this.panel.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }
}

module.exports = {DocumentOutlineView}
