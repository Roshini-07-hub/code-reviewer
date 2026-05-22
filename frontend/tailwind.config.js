export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07090f',
        panel: '#10131d',
        line: '#252b3a',
        accent: '#3dd6c6',
        danger: '#ff6678',
        warning: '#f6c85f'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(61,214,198,.2), 0 20px 60px rgba(0,0,0,.35)'
      }
    }
  },
  plugins: []
};
