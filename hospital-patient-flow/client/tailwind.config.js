/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        hospital: {
          ink: '#18333a',
          teal: '#0f9f94',
          blue: '#2563eb',
          mint: '#dff7f3',
          coral: '#ef6f6c',
          amber: '#f59e0b'
        }
      }
    }
  },
  plugins: []
};
