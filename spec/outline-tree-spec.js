/* eslint-env node, browser, jasmine */
const {OutlineTreeView, OutlineTreeRoot} = require('../lib/outline-tree');

describe('OutlineTreeView', () => {
  describe('When a single node with no children is created', () => {
    it('Should render a single element', () => {
      let view = new OutlineTreeView({icon: 'icon-morder-board', plainText: 'test'});
      // let view = new OutlineTreeView({greeting: 'Hello'})
      let el = view.render();
      expect(el).toBeDefined();
    });
    it('Should render an element with children', () => {
      let view = new OutlineTreeView(
        {icon: 'icon-morder-board', plainText: 'test',
          children: [{icon: 'icon-morder-board', plainText: 'test child 1'}]
        }
        );
      // let view = new OutlineTreeView({greeting: 'Hello'})
      let el = view.render();
      expect(el).toBeDefined();
    });
  });
});
describe('OutlineTreeRoot', () => {
  it('Should render an root list', () => {
    let items = [{icon: 'icon-morder-board', plainText: 'test child 1'}];
    let view = new OutlineTreeRoot(items);
    let el = view.render();
    expect(el).toBeDefined();
  });
});
