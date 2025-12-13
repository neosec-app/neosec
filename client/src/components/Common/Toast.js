import React from 'react';

function Toast({ toasts, palette }) {
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 1500,
            alignItems: 'center',
            pointerEvents: 'none'
        }}>
            {toasts.map((t) => (
                <div
                    key={t.id}
                    style={{
                        minWidth: '260px',
                        maxWidth: '500px',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        backgroundColor: t.type === 'error' ? palette.danger : t.type === 'success' ? palette.accent : palette.bgCard,
                        color: t.type === 'error' || t.type === 'success' ? '#fff' : palette.text,
                        border: `1px solid ${palette.border}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        fontSize: '14px',
                        fontWeight: 500,
                        animation: t.visible !== false
                            ? 'toastSlideIn 0.3s ease-out'
                            : 'toastFadeOut 0.3s ease-in',
                        animationFillMode: 'forwards',
                        pointerEvents: 'auto',
                        transition: 'opacity 0.3s ease, transform 0.3s ease'
                    }}
                >
                    {t.message}
                </div>
            ))}
            <style>{`
                @keyframes toastSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                @keyframes toastFadeOut {
                    from {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                    }
                }
            `}</style>
        </div>
    );
}

export default Toast;

