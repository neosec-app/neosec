import { useState } from 'react';

export const useToastManager = () => {
    const [toasts, setToasts] = useState([]);
    
    const showToast = (message, type = 'info') => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type, visible: true }]);
        
        // Start fade out animation before removal
        setTimeout(() => {
            setToasts((prev) => prev.map(t => t.id === id ? { ...t, visible: false } : t));
        }, 2900);
        
        // Remove from array after fade out completes
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    };

    return { toasts, showToast };
};

