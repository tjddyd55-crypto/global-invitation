module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  plugins: ['i18next'],
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      excludedFiles: [
        'app/**/*',
        'src/components/LanguageSelector.tsx',
        'src/components/TemplateGalleryModal.tsx',
      ],
      rules: {
        'i18next/no-literal-string': [
          'error',
          {
            markupOnly: true,
            ignoreAttribute: ['data-testid', 'aria-label'],
            ignorePattern: ['^debug:', '^test:'],
          },
        ],
      },
    },
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      rules: {
        'i18next/no-literal-string': 'off',
      },
    },
  ],
};
