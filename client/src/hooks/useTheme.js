import { useState, useEffect } from 'react';

export const useTheme = () => {
    const initialTheme = (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'dark';
    const [theme, setTheme] = useState(initialTheme); // 'dark' | 'light'
    
    const themeVars = {
        // Keep dark close to original green tone
        dark: {
            bgMain: '#121212',
            bgCard: '#181818',
            bgPanel: '#0a0a0a',
            text: '#ffffff',
            textMuted: '#9aa3b5',
            border: '#242424',
            accent: '#36E27B',
            accentSoft: 'rgba(54,226,123,0.12)',
            warning: '#f0a500',
            danger: '#e04848',
            inputBg: '#1c1c1c',
            inputBorder: '#2c2c2c'
        },
        // Light theme aligned to Figma green style
        light: {
            bgMain: '#f6f8fb',          // soft gray-blue background
            bgCard: '#ffffff',          // white cards
            bgPanel: '#eef3f8',         // slightly tinted panel
            text: '#0b172a',            // deep navy text
            textMuted: '#5b6b7a',       // muted gray-blue
            border: '#d9e2ec',          // subtle border
            accent: '#1fa45a',          // green primary
            accentSoft: '#e6f4ed',      // light green tint
            warning: '#d97706',
            danger: '#d4183d',
            inputBg: '#ffffff',
            inputBorder: '#d9e2ec'
        }
    };
    
    const palette = themeVars[theme];

    useEffect(() => {
        // Smooth theme transition
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light');
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        document.body.style.backgroundColor = palette.bgMain;
        document.body.style.color = palette.text;
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', theme);
        }
    }, [theme, palette]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    return { theme, setTheme, toggleTheme, palette };
};

