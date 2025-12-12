/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                primary: "#36e27b",
                "background-light": "#f6f8f7",
                "background-dark": "#121212",
                "form-background-dark": "#181818",
                "input-background-dark": "#282828",
                "text-light": "#FFFFFF",
                "text-muted": "#B3B3B3",
                "error-red": "#D32F2F",
            }
        }
    },
    plugins: [],
};
