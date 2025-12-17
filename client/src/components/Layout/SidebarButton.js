import React, { useState } from 'react';

function SidebarButton({ label, view, currentView, setCurrentView, theme = 'dark', palette }) {
    const active = currentView === view;
    const [hover, setHover] = useState(false);

    return (
        <button
            onClick={() => setCurrentView(view)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: '100%',
                padding: '12px 15px',
                marginBottom: '10px',
                backgroundColor: active || hover
                    ? (theme === 'light' ? palette.accentSoft : (active ? '#1E402C' : 'rgba(255, 255, 255, 0.1)'))
                    : 'transparent',
                color: active
                    ? palette.accent
                    : (theme === 'light' ? palette.text : '#ffffff'),
                border: active || hover
                    ? `1px solid ${palette.accent}`
                    : '1px solid transparent',
                borderRadius: '10px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.15s ease',
                boxShadow: hover ? '0 6px 14px rgba(0,0,0,0.08)' : 'none'
            }}
        >
            {label}
        </button>
    );
}

export default SidebarButton;

