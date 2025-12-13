export const getCardShadow = (theme) => {
    return theme === 'light' ? '0 12px 30px rgba(17, 24, 39, 0.08)' : 'none';
};

export const getCardBaseStyle = (palette, theme) => {
    const cardShadow = getCardShadow(theme);
    const cardBorder = `1px solid ${palette.border}`;
    
    return {
        backgroundColor: palette.bgCard,
        borderRadius: 14,
        border: cardBorder,
        boxShadow: cardShadow,
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
    };
};

