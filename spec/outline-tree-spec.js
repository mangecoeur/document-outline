/* eslint-env node, browser, jasmine */
const {OutlineTreeView} = require('../lib/outline-tree');

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
