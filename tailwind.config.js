/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        primary: "#161622",
        secondary: {
          DEFAULT: "#FF9C01",
          100: "#FF9001",
          200: "#FF8E01",
        },
        black: {
          DEFAULT: "#000",
          100: "#1E1E2D",
          200: "#232533",
        },
        gray: "#CDCDE0",
       
      },
      fontFamily: {
        poppins_thin: 'Poppins_100Thin',
        poppins_thin_italic: 'Poppins_100Thin_Italic',
        poppins_extralight: 'Poppins_200ExtraLight',
        poppins_light: 'Poppins_300Light',
        poppins: 'Poppins_400Regular',        // your original
        poppins_medium: 'Poppins_500Medium',
        poppins_semibold: 'Poppins_600SemiBold',
        poppins_bold: 'Poppins_700Bold',
        poppins_extrabold: 'Poppins_800ExtraBold',
        poppins_black: 'Poppins_900Black',
      },
    },
  },
  plugins: [],
};


