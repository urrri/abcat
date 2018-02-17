/**
 * set of unmapped labels from info files
 * @type {Set<string>}
 */
export const unknownFields = new Set();

export const addToUnknownFields = (label) => {
  unknownFields.add(label);
};

/**
 * map of label name from info file to tag of the field
 */
export const knownFields = { // todo: load from config
};

/**
 * predefined types of fields
 */
export const fieldTypes = {
  text: 'text',
  number: 'number',
  array: 'array',
  arrayOfFields: 'arrayOfFields',
  unused: 'unused',
  year: 'year',
  duration: 'duration'
};

/**
 * default field definitions
 */
export const defaultFields = {
  unused: {
    type: fieldTypes.unused
  },
  other: {
    title: 'Other',
    type: fieldTypes.array,
    multiline: true
  },
  title: {
    title: 'Title',
    type: fieldTypes.text,
    required: true
  },
  series: {
    title: 'Series',
    type: fieldTypes.array,
    required: true
  },
  indexInSeries: {
    title: 'Index in Series',
    type: fieldTypes.number,
    required: true
  },
  authorFirstName: {
    title: 'Author First Name',
    type: fieldTypes.text,
    required: true,
    partOfField: 'authorName'
  },
  authorLastName: {
    title: 'Author Last Name',
    type: fieldTypes.text,
    required: true,
    partOfField: 'authorName'
  },
  coAuthors: {
    title: 'co-Authors',
    type: fieldTypes.arrayOfFields,
    partOfField: 'authorName',
    fields: {
      firstName: {
        title: 'First Name',
        type: fieldTypes.text,
        partOfField: 'authorName'
      },
      lastName: {
        title: 'Last Name',
        type: fieldTypes.text,
        partOfField: 'authorName'
      }
    }
  },
  author: {
    title: 'Author(s)',
    type: fieldTypes.text,
    compositeField: ['authorFirstName', 'authorFamilyName', 'coAuthors']
  },
  description: {
    title: 'Description',
    type: fieldTypes.array,
    multiline: true
  },
  genre: {
    title: 'Genre',
    type: fieldTypes.string
  },
  reciter: { // reader
    title: 'Reciter',
    type: fieldTypes.string
  },
  year: {
    title: 'Year of Issue',
    type: fieldTypes.year
  },
  duration: {
    title: 'Duration',
    type: fieldTypes.duration
  },
  fantlabId: {
    title: 'Fantlab.ru ID'
  }
};

/**
 * user defined field definitions
 */
export const userFields = { // todo: load from config
};

export const addUserField = (tag, title, type) => {
  userFields[tag] = {
    tag,
    title,
    type
  };
};

/**
 * Function parses value according to the field type and puts it back to the value property
 * @param {{field, value, text}} line object contains field, value and text properties
 * @return {boolean} true if value is finally and false if it requires user interaction
 */
export const tryParseFieldValue = (line) => {
  // todo: implement, parse value according to field type
  return false;
};
