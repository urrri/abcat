import { parseField, fieldStatus } from './fields';

export const getDefaultInfo = () => ({
  dirty: true
});

const convertToLines = (text) => {
  if (Array.isArray(text)) return text;
  return text.trim().split('\n').map((line) => {
    return {
      text: line.trim(),
      // field: '',
      status: fieldStatus.UNKNOWN
    };
  });
};

/**
 *
 * @param {string|Array} linesOrText list of lines from info file ot its content
 * @return {Array}
 */
export const parseInfoFields = (linesOrText) => {
  const lines = convertToLines(linesOrText);
  lines.forEach(parseField);
  return lines;
};
