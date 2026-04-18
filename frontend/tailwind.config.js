/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:       '#87986a',   /* palm-leaf      */
        secondary:     '#718355',   /* dusty-olive    */
        hunter:        '#4a5e33',   /* hunter-dark    */
        evergreen:     '#1e2e14',   /* evergreen      */
        'frosted-mint':'#e9f5db',   /* frosted-mint   */
        'tea-green':   '#cfe1b9',   /* tea-green      */
        dark:          '#1e2e14',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.5s ease-out',
        'slide-down':'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
