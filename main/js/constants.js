const ISSUE_KEY = {
  weight: 1,
  name: {
    EN: 'Issue key',
    RU_1: 'Ключ задачи',
    RU_2: 'Ключ проблемы',
  },
};

const SUMMARY = {
  weight: 2,
  name: {
    EN: 'Summary',
    RU_1: 'Pезюме',
    RU_2: 'Тема',
  },
};

const DEFAULT_FIELDS = [
  ISSUE_KEY,
  SUMMARY,
];

const NAMES = {
  ISSUE_KEY,
  SUMMARY,
};

const ALL_FIELDS = [
  'ISSUE_KEY',
  'SUMMARY',
];

const LANGUAGES = {
  EN: 'EN',
  RU_1: 'RU_1',
  RU_2: 'RU_2',
};

const SKIP_FILTERS = {
  EN: new RegExp(/^Custom field \((.*?)\)$/),
  RU_1: new RegExp(/^Пользовательское поле \((.*?)\)$/),
  RU_2: new RegExp(/^Пользовательское поле \((.*?)\)$/),
};

export { ISSUE_KEY, ALL_FIELDS, DEFAULT_FIELDS, LANGUAGES, NAMES, SKIP_FILTERS, SUMMARY };