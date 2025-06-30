
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PcaReport, TabId, ModalConfig } from './types';
import { TABS } from './constants';
import { usePcaStore } from './hooks/usePcaStore';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import PcaList from './components/PcaList';
import NewPcaForm from './components/NewPcaForm';
import Settings from './components/Settings';
import Modal from './components/Modal';
import PrintView from './components/PrintView';

type ToastMessage = {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
};

export default function App(): React.ReactNode {
    const [activeTab, setActiveTab] = useState<TabId>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
    
    const [reportToPrint, setReportToPrint] = useState<PcaReport | null>(null);

    const { reports, addReport, deleteReport, clearAllData, importData, exportData, getDashboardStats, getFrequencyStatuses } = usePcaStore();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleResize = (): void => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success'): void => {
        const newToast = { id: Date.now(), message, type };
        setToasts(currentToasts => [...currentToasts, newToast]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
        }, 4000);
    }, []);

    const showModal = useCallback((config: Omit<ModalConfig, 'onClose'>): Promise<boolean> => {
        return new Promise(resolve => {
            setModalConfig({
                ...config,
                onClose: (result: boolean) => {
                    setModalConfig(null);
                    resolve(result);
                },
            });
        });
    }, []);

    const handleSetTab = useCallback((tabId: TabId) => {
        setActiveTab(tabId);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    }, []);

    const handlePrint = useCallback((report: PcaReport) => {
        setReportToPrint(report);
        setTimeout(() => {
            window.print();
            setReportToPrint(null);
        }, 200);
    }, []);

    const renderContent = (): React.ReactNode => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard stats={getDashboardStats()} frequencyStatuses={getFrequencyStatuses()} />;
            case 'lista-pca':
                return <PcaList reports={reports} frequencyStatuses={getFrequencyStatuses()} onDelete={deleteReport} onPrint={handlePrint} showModal={showModal} showToast={showToast} />;
            case 'nuovo-pca':
                return <NewPcaForm onSave={addReport} onCancel={() => handleSetTab('lista-pca')} showToast={showToast} />;
            case 'impostazioni':
                return <Settings onImport={importData} onExport={exportData} onClearAll={clearAllData} showModal={showModal} showToast={showToast} />;
            default:
                return null;
        }
    };

    const pageTitle = useMemo(() => TABS.find(tab => tab.id === activeTab)?.label || 'Dashboard', [activeTab]);

    return (
        <div className={`flex h-screen w-full`}>
            {modalConfig && <Modal {...modalConfig} />}
            {reportToPrint && <PrintView report={reportToPrint} />}

            <div id="toast-container" className="fixed bottom-5 right-5 z-[1050] space-y-3">
                {toasts.map(({ id, message, type }) => {
                    const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
                    return (
                        <div key={id} className={`toast-item ${colors[type]} text-white font-medium px-6 py-3 rounded-lg shadow-lg animate-fade-in-up`} role="alert">
                            {message}
                        </div>
                    );
                })}
            </div>
            
            <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={handleSetTab} />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen && window.innerWidth >= 1024 ? 'lg:ml-64' : ''}`}>
                <Header 
                    pageTitle={pageTitle} 
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                    theme={theme}
                    setTheme={setTheme}
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100 dark:bg-slate-900">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}
