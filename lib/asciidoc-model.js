const {AbstractModel} = require('./abstract-model');
// TODO add support for settext style title (which is allowed)
// Atx style headers only. Setext headers are not supported
// http://asciidoctor.org/docs/asciidoc-recommended-practices/#section-titles
const HEADING_REGEX = /^(=={0,5}|#\#{0,5})[ \t]+(.+?)(?:[ \t]+\1)?$/gm;

class AsciiDocModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
    this.sectionLevels = {};
  }

  getRegexData(scanResult) {
    let level = 1;
    let c = scanResult[1].length;

    // Sometimes sectionLevels not set. Shouldn't happen but cant be bother to figure out why it does
    if (this.sectionLevels === undefined) {
      this.sectionLevels = {};
    }

    if (c in this.sectionLevels) {
      level = this.sectionLevels[c];
    } else {
      level = Object.keys(this.sectionLevels).length + 1;
      this.sectionLevels[c] = level;
    }
    return {
      level: level,
      label: scanResult[2]
    };
  }
}

module.exports = {AsciiDocModel};
