// added: the lesson used create-next-app, which writes this file for you.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [require("@tailwindcss/typography")], // from the streaming lesson
};
