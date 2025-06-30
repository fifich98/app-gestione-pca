
import React, { useMemo, useState } from 'react';
import { PcaReport, FrequencyStatus } from '../types';
import { WBS_DATA } from '../constants';

interface PcaListProps {
    reports: PcaReport[];
    frequencyStatuses: {
        statusMap: Record<string, FrequencyStatus>;
    };
    onDelete: (id: number) => Promise<void>;
    onPrint: (report: PcaReport) => void;
    showModal: (config: any) => Promise<boolean>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ReportGroup: React.FC<{
    wbsKey: string;
    reports: PcaReport[];
    frequencyStatuses: { statusMap: Record<string, FrequencyStatus> };
    onDelete: (id: number) => Promise<void>;
    onPrint: (report: PcaReport) => void;
    showModal: (config: any) => Promise<boolean>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}> = ({ wbsKey, reports, frequencyStatuses, onDelete, onPrint, showModal, showToast }) => {
    const [isOpen, setIsOpen] = useState(true);

    const handleDelete = async (report: PcaReport) => {
        const confirmed = await showModal({
            title: 'Conferma Eliminazione',
            message: `Sei sicuro di voler eliminare il Controllo N° ${report.id}? L'azione è irreversibile.`,
            confirmText: 'Elimina',
            confirmColor: 'bg-red-600',
        });
        if (confirmed) {
            await onDelete(report.id);
            showToast(`Controllo N° ${report.id} eliminato.`, 'info');
        }
    };

    const wbsInfo = WBS_DATA[wbsKey] || { descrizione: 'Controlli Generici' };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
            <header
                className="p-4 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{wbsKey}</span>
                    <h3 className="text-lg font-semibold">{wbsInfo.descrizione}</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">{reports.length} {reports.length === 1 ? 'controllo' : 'controlli'}</span>
                    <svg className={`w-6 h-6 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </header>
            {isOpen && (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-transparent text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-800">
                            <tr>
                                {['ID', 'Data', 'Tipo', 'Oggetto', 'Stato Frequenza', 'Prossimo Controllo', 'Azioni'].map(h => <th key={h} className="p-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {reports.map(report => {
                                const wbsCode = report.wbs ? report.wbs.substring(0, 2).toUpperCase() : null;
                                const freqStatus = report.type === 'periodico' && wbsCode ? frequencyStatuses.statusMap[wbsCode] : null;
                                const typeLabels = { 'periodico': 'Periodico', 'preliminare': 'Preliminare', 'finale': 'Finale' };
                                const typeColors = { 'periodico': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', 'preliminare': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', 'finale': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
                                return (
                                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="p-3 font-medium">{report.id}</td>
                                        <td className="p-3 whitespace-nowrap">{new Date(report.date + "T00:00:00").toLocaleDateString('it-IT')}</td>
                                        <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeColors[report.type] || 'bg-gray-100 text-gray-800'}`}>{typeLabels[report.type] || 'N.D.'}</span></td>
                                        <td className="p-3 max-w-xs truncate">{report.activities || 'N.A.'}</td>
                                        <td className="p-3">{freqStatus ? <span className={`text-xs font-semibold px-2 py-1 rounded-full ${freqStatus.color}`}>{freqStatus.text}</span> : '-'}</td>
                                        <td className="p-3 whitespace-nowrap">{freqStatus?.nextDate ? freqStatus.nextDate.toLocaleDateString('it-IT') : '-'}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => onPrint(report)} className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400" title="Stampa"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg></button>
                                                <button onClick={() => handleDelete(report)} className="text-slate-500 hover:text-red-600 dark:hover:text-red-400" title="Elimina"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default function PcaList({ reports, frequencyStatuses, onDelete, onPrint, showModal, showToast }: PcaListProps): React.ReactNode {
    const groupedReports = useMemo(() => {
        const sortedReports = [...reports].sort((a, b) => b.id - a.id);
        return sortedReports.reduce((acc, report) => {
            const wbsKey = (report.type === 'periodico' ? report.wbs.substring(0, 2).toUpperCase() : 'Generico') || 'Generico';
            if (!acc[wbsKey]) {
                acc[wbsKey] = [];
            }
            acc[wbsKey].push(report);
            return acc;
        }, {} as Record<string, PcaReport[]>);
    }, [reports]);

    const sortedWbsKeys = useMemo(() => {
        const wbsOrder = Object.keys(WBS_DATA);
        return Object.keys(groupedReports).sort((a, b) => {
            if (a === 'Generico') return 1;
            if (b === 'Generico') return -1;
            const indexA = wbsOrder.indexOf(a);
            const indexB = wbsOrder.indexOf(b);
            return indexA - indexB;
        });
    }, [groupedReports]);

    if (reports.length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold">Nessun controllo trovato</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Inizia compilando il tuo primo verbale dalla sezione "Esegui Controllo".</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {sortedWbsKeys.map(wbsKey => (
                <ReportGroup
                    key={wbsKey}
                    wbsKey={wbsKey}
                    reports={groupedReports[wbsKey]}
                    frequencyStatuses={frequencyStatuses}
                    onDelete={onDelete}
                    onPrint={onPrint}
                    showModal={showModal}
                    showToast={showToast}
                />
            ))}
        </div>
    );
}
