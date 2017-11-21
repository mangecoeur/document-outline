
class MockModel {
  // NOTE: if it was possible to simply scan through applied scopes, wouldn't need most of this...
  constructor(headings) {
    this.headings = headings;
  }

  parse() {
    return this.headings;
  }

  onDidUpdate(callback) {
    return this.emitter.on('did-update', callback);
  }
  onDidError(callback) {
    return this.emitter.on('did-error', callback);
  }

  destroy() {
    this.subscriptions.dispose();
    // this.headingMarkerLayer.destroy();
  }

  update() {
    let headings = this.parse();
    this.emitter.emit("did-update", headings);
  }
}

module.exports = {MockModel}
