import {addToUnknownFields, knownFields, tryParseFieldValue} from './fields';

export const getDefaultInfo = () => ({
  dirty: true
});

const maxFieldName = 20;
const separator = ':';

const BOOK_TITLE_FIELD = 'title';
const DESCRIPTION_FIELD = 'description';

const UNKNOWN_FIELD = 'unknown field';
const EXPECTED_FIELD = 'expected field';
const EXPECTED_FIELD_VALUE = 'expected field value';
const TRUST = 'full trust';

export const confidence = {
  UNKNOWN_FIELD, EXPECTED_FIELD, EXPECTED_FIELD_VALUE, TRUST
};

const convertToLines = (text) => {
  if (Array.isArray(text)) return text;
  return text.split('\n').map((line) => {
    return {
      text: line.trim(),
      // field: '',
      confidence: UNKNOWN_FIELD
    };
  });
};

/**
 *
 * @param {string|Array} linesOrText list of lines from info file ot its content
 * @return {Array}
 */
export const parseInfoFields = (linesOrText) => {
  let firstLine = true;
  const lines = convertToLines(linesOrText);
  lines.forEach((line) => {
    const {confidence, text} = line;
    if (confidence !== UNKNOWN_FIELD) return;
    if (!text) {
      // empty line
      line.field = 'unused';
      line.confidence = TRUST;
      return;
    }
    if (text.indexOf(separator) < 0) {
      // short first line without ':' - expected title field
      line.confidence = EXPECTED_FIELD;
      line.field = text.length < 80 && firstLine ? BOOK_TITLE_FIELD : DESCRIPTION_FIELD;
      firstLine = false;
      return;
    }
    firstLine = false;

    let [name, value] = text.split(separator, 2);// eslint-disable-line prefer-const
    name = (name || '').trim();
    const field = knownFields[name];
    if (!field) {
      if (name.length < maxFieldName) {
        addToUnknownFields(name);
      } else {
        // too long unknown field - expected as part of description
        line.confidence = EXPECTED_FIELD;
        line.field = DESCRIPTION_FIELD;
      }
    } else {
      line.field = field;
      line.value = (value || '').trim();
      line.confidence = tryParseFieldValue(line) ? TRUST : EXPECTED_FIELD_VALUE;
    }
  });
  return lines;
};
