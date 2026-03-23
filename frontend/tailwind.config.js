/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false,
  },
  content: [
    './app/admin/super/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/admin/super/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/DataTable.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
