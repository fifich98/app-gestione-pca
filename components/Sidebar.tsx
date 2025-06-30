
import React from 'react';
import { TabId } from '../types';
import { TABS } from '../constants';

interface SidebarProps {
    isOpen: boolean;
    setOpen: (isOpen: boolean) => void;
    activeTab: TabId;
    setActiveTab: (tabId: TabId) => void;
}

export default function Sidebar({ isOpen, setOpen, activeTab, setActiveTab }: SidebarProps): React.ReactNode {
    return (
        <>
            <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-[1001] w-64 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="h-16 flex items-center justify-center px-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <img src="https://raw.githubusercontent.com/fifich98/app-gestione-pca/main/LOGOCHRYSAS.bmp" alt="Logo CHRYSAS" className="h-8" />
                </div>
                <nav className="flex-grow px-4 py-6 overflow-y-auto">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <a
                                key={tab.id}
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setActiveTab(tab.id);
                                }}
                                className={`flex items-center px-4 py-3 mt-2 rounded-md transition-colors duration-200
                                    ${isActive
                                        ? 'bg-blue-600 text-white font-semibold shadow'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab.icon({ className: 'w-6 h-6 mr-3' })}
                                {tab.label}
                            </a>
                        );
                    })}
                </nav>
            </aside>
            {isOpen && <div onClick={() => setOpen(false)} className="fixed inset-0 bg-black/30 z-[1000] lg:hidden"></div>}
        </>
    );
}
