const {AbstractModel} = require('./abstract-model');

// Possible regex to exclude commented lines
// ^(?:!%)*\s*
const H1_REGEX = /(\\part\*?)(\[.*\])?{([^}]*)/;
const H2_REGEX = /(\\chapter\*?)(\[.*\])?{([^}]*)/;
const H3_REGEX = /(\\section|frametitle\*?)(\[.*\])?{([^}]*)/;
const H4_REGEX = /(\\subsection|framesubtitle\*?)(\[.*\])?{([^}]*)/;
const H5_REGEX = /(\\subsubsection\*?)(\[.*\])?{([^}]*)/;
const H6_REGEX = /(\\paragraph\*?)(\[.*\])?{([^}]*)/;
const H7_REGEX = /(\\subparagraph\*?)(\[.*\])?{([^}]*)/;

const HEADING_REGEXES = [H1_REGEX, H2_REGEX, H3_REGEX, H4_REGEX, H5_REGEX, H6_REGEX, H7_REGEX];

// let COMBO_REGEX = '';
//
// for (let regex of HEADING_REGEXES) {
//   // Join the regexes together, adding wildcard to match whole line, which lets
//   // us detect '%' comment marks later
//   COMBO_REGEX = COMBO_REGEX + '(.*' + regex.source + ')|';
// }
// const HEADING_REGEX = new RegExp(COMBO_REGEX.slice(0, -1), 'gm');

let HEADING_REGEX = /(\\(?:part|chapter|section|frametitle|subsection|framesubtitle|subsubsection|paragraph|subparagraph)\*?)(\[.*\])?{([^}]*)/gm
// const HEADING_REGEX = /(\\((sub)*)section\*?){(.*)}/g;
class LatexModel extends AbstractModel {
  constructor(editorOrBuffer) {
    super(editorOrBuffer, HEADING_REGEX);
    // Because 'part' is considered as level -1, increase the max depth
    // to get expected result
    this.maxDepth += 1;
  }

  getRegexData(scanResult) {
    let level = 0;
    let label = '';
    let heading = scanResult[0];
    heading = heading.trim();
    // Skip result if line is commented out.
    if (heading.startsWith("%")) {
      return;
    }

    for (let regex of HEADING_REGEXES) {
      level += 1;
      if (level <= this.maxDepth) {
        let subresult = regex.exec(heading);
        if (subresult) {
          label = subresult[3];
          break;
        }
      }
    }

    return {
      level: level,
      label: label
    };
  }
}

module.exports = {LatexModel}
