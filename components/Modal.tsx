
import React, { useState, useEffect } from 'react';

interface ModalProps {
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onClose: (result: boolean) => void;
    needsConfirmation?: boolean;
    confirmationText?: string;
}

export default function Modal({
    title,
    message,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    confirmColor = 'bg-blue-600',
    onClose,
    needsConfirmation = false,
    confirmationText = ''
}: ModalProps): React.ReactNode {
    const [confirmInput, setConfirmInput] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(!needsConfirmation);

    useEffect(() => {
        if (needsConfirmation) {
            setIsConfirmed(confirmInput === confirmationText);
        }
    }, [confirmInput, needsConfirmation, confirmationText]);

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1040] p-4 animate-fade-in"
            onClick={() => onClose(false)}
        >
            <div
                className="modal-box bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">{title}</h3>
                <div className="text-slate-600 dark:text-slate-300 mb-6 text-sm">{message}</div>
                
                {needsConfirmation && (
                    <input
                        type="text"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                        className="form-input w-full mb-6 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                        placeholder={`Digita "${confirmationText}"`}
                    />
                )}
                
                <div className="flex justify-end gap-4">
                    <button onClick={() => onClose(false)} className="px-5 py-2 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold transition">
                        {cancelText}
                    </button>
                    <button
                        onClick={() => onClose(true)}
                        disabled={!isConfirmed}
                        className={`px-5 py-2 text-white rounded-md ${confirmColor} font-semibold transition ${isConfirmed ? 'hover:opacity-90' : 'opacity-50 cursor-not-allowed'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
