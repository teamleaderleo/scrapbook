/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
