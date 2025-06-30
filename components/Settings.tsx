
import React, { useRef } from 'react';

interface SettingsProps {
    onImport: (file: File) => Promise<void>;
    onExport: () => void;
    onClearAll: () => Promise<void>;
    showModal: (config: any) => Promise<boolean>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function Settings({ onImport, onExport, onClearAll, showModal, showToast }: SettingsProps): React.ReactNode {
    const importFileRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const confirmed = await showModal({
            title: 'Conferma Importazione',
            message: "ATTENZIONE: i dati attuali verranno SOVRASCRITTI in modo permanente. Continuare?",
            confirmText: 'Sovrascrivi e Importa',
            confirmColor: 'bg-orange-500',
        });

        if (confirmed) {
            try {
                await onImport(file);
                showToast("Dati importati con successo!", 'success');
            } catch (error) {
                console.error("Import error:", error);
                showToast(error instanceof Error ? error.message : "Errore: il file di backup non è valido.", 'error');
            }
        }
        // Reset file input
        if (importFileRef.current) {
            importFileRef.current.value = '';
        }
    };

    const handleClearAll = async () => {
        const confirmed = await showModal({
            title: 'Azione Irreversibile',
            message: (
                <div>
                    <p>Sei assolutamente sicuro di voler eliminare TUTTI i controlli salvati? Questa azione non può essere annullata.</p>
                    <p className="mt-2">Per confermare, digita "<b>ELIMINA</b>" nel campo sottostante.</p>
                </div>
            ),
            confirmText: 'Elimina Tutto',
            confirmColor: 'bg-red-600',
            needsConfirmation: true,
            confirmationText: 'ELIMINA'
        });

        if (confirmed) {
            await onClearAll();
            showToast("Archivio svuotato con successo.", "info");
        }
    };
    
    return (
        <div className="space-y-8 max-w-2xl animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-2">Archiviazione Dati</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Salva una copia di sicurezza dei tuoi verbali su un file, o ripristina i dati da un backup precedente.</p>
                <div className="flex gap-4 flex-wrap">
                    <button onClick={onExport} className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition">Esporta Dati</button>
                    <button onClick={handleImportClick} className="px-5 py-2 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold transition">Importa Dati</button>
                    <input type="file" ref={importFileRef} onChange={handleFileChange} className="hidden" accept=".json" />
                </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-800">
                <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Zona Pericolo</h2>
                <p className="text-red-800/80 dark:text-red-300/80 mb-4 text-sm">Le azioni in questa sezione sono irreversibili. Usare con la massima cautela.</p>
                <button onClick={handleClearAll} className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-semibold transition">Svuota Archivio Dati</button>
            </div>
        </div>
    );
}
