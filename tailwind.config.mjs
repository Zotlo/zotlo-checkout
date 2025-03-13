/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif']
      },
      display: ['group-hover'],
    },
    colors: {
      transparent: 'transparent',
      primary: {
        50: '#F7F5FF',
        100: '#EFECFF',
        200: '#CBC1FF',
        300: '#846CFF',
        500: '#4329CC',
        700: '#1F0B88',
        900: '#120266'
      },
      secondary: {
        100: '#E5F3FF',
        200: '#B7DEFF',
        300: '#5CB5FF',
        500: '#008BFF',
        700: '#0075D6',
        900: '#004884'
      },
      neutral: {
        100: '#F6F7F9',
        200: '#E7EAEE',
        300: '#C3C9D5',
        400: '#ACB4C3',
        500: '#818A9C',
        600: '#586174',
        700: '#3C4353',
        800: '#242A38',
        900: '#151B26'
      },
      success: {
        100: '#E8FFF7',
        200: '#BFFFE8',
        300: '#97FFDA',
        400: '#1BF5A7',
        500: '#05CC85',
        600: '#0CBC7D',
        700: '#068E03',
        800: '#007A4F',
        900: '#005235'
      },
      warning: {
        100: '#FDFAE7',
        200: '#F9EEB5',
        300: '#FFEC8A',
        400: '#FFDF3B',
        500: '#EBC80F',
        600: '#E0BC00',
        700: '#998100',
        800: '#705E00',
        900: '#483C00'
      },
      error: {
        100: '#FFF1F0',
        200: '#FFD0CC',
        300: '#FF7F76',
        400: '#FF4537',
        500: '#E13023',
        600: '#BF1E12',
        700: '#9D1006',
        800: '#7B0900',
        900: '#590600'
      },
      orange: {
        100: '#FFF5F0',
        500: '#E17E23'
      },
      white: '#FFFFFF',
      surface: '#F0F3F8'
    },
    spacing: {
      0: '0rem',
      4: '0.25rem',
      8: '0.5rem',
      12: '0.75rem',
      16: '1rem',
      20: '1.25rem',
      24: '1.5rem',
      32: '2rem',
      40: '2.5rem',
      48: '3rem',
      56: '3.5rem',
      64: '4rem',
      72: '4.375rem',
      80: '5rem',
      96: '6rem',
      128: '8rem',
      160: '10rem',
      192: '11.375rem',
      224: '14rem'
    },
    fontSize: {
      72: ['4.5rem', { lineHeight: '5.375rem' }],
      60: ['3.75rem', { lineHeight: '4.5rem' }],
      48: ['3rem', { lineHeight: '3.5rem' }],
      40: ['2.5rem', { lineHeight: '3rem' }],
      32: ['2rem', { lineHeight: '2.5rem' }],
      24: ['1.5rem', { lineHeight: '2rem' }],
      20: ['1.25rem', { lineHeight: '1.75rem' }],
      16: ['1rem', { lineHeight: '1.5rem' }],
      14: ['0.875rem', { lineHeight: '1.25rem' }],
      12: ['0.75rem', { lineHeight: '1rem' }],
      10: ['0.625rem', { lineHeight: '0.875rem' }]
    },
    borderRadius: {
      full: '50%',
      16: '1rem',
      8: '0.5rem',
      4: '0.25rem',
      2: '0.125rem'
    },
    boxShadow: {
      xs: `0 0 0.25rem rgba(27, 33, 44, 0.08)`,
      s: '0 0.125rem 0.5rem rgba(27, 33, 44, 0.08)',
      md: '0 0.25rem 1rem rgba(27, 33, 44, 0.08)',
      l: '0 0.75rem 2rem rgba(27, 33, 44, 0.08)',
      xl: '0 1.5rem 3rem rgba(27, 33, 44, 0.16)',
      xxl: '0 2rem 4rem rgba(27, 33, 44, 0.16)',
      input: '0 0 0 0.25rem #EDEFFC',
      'input-error': '0 0 0 0.25rem #FFF1F0',
      grey: '0 0 0 4px rgba(246, 247, 249, 1) #F6F7F9',
      dark: '0 0 0 4px #E7EAEE',
      primary: '0 0 0 4px #EFECFF',
      secondary: '0 0 0 4px #F7F5FF',
      outline: '0 0 0 4px #F6F7F9',
      error: '0 0 0 4px #FFF1F0',
      none: 'none'
    },
    animation: {
      fadeIn: 'fadeIn 0.5s ease-in',
      spin: 'spin 1s linear infinite'
    },
    keyframes: {
      spin: {
        to: {
          transform: 'rotate(360deg)'
        }
      },
      fadeIn: {
        '0%': { opacity: 0 },
        '100%': { opacity: 1 }
      }
    }
  }
};
