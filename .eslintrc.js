const fs = require('fs');
const path = require('path');

const prettierOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '.prettierrc'), 'utf8'),
);

module.exports = {
  extends: ['react-app', 'prettier'],
  plugins: ['prettier', 'unused-imports'],
  rules: {
    'prettier/prettier': ['error', prettierOptions],
    'unused-imports/no-unused-imports-ts': ['error'],
    // https://github.com/i18next/next-i18next/issues/1917
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "react-i18next",
            "importNames": ["useTranslation"],
            "message": "Import useTranslation from next-i18next instead."
          }
        ]
      }
    ]
  },
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      rules: { 'prettier/prettier': ['warn', prettierOptions] },
    },
  ],
};
