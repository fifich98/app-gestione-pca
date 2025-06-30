
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DueListItem } from '../types';
import { WBS_DATA } from '../constants';

interface DashboardProps {
    stats: {
        totalPca: number;
        openNc: number;
        totalChecks: number;
        avgCompliance: string;
        ncByAspect: Record<string, number>;
    };
    frequencyStatuses: {
        dueList: DueListItem[];
    };
}

const StatCard: React.FC<{ label: string; value: string | number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => {
    const colorClasses: Record<string, string> = {
        blue: 'border-blue-500 text-blue-500',
        red: 'border-red-500 text-red-500',
        indigo: 'border-indigo-500 text-indigo-500',
        green: 'border-green-500 text-green-500',
    };

    return (
        <div className={`bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm flex items-center gap-5 border-t-4 ${colorClasses[color]}`}>
            <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</h3>
                <p className="mt-1 text-3xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    );
};

export default function Dashboard({ stats, frequencyStatuses }: DashboardProps): React.ReactNode {
    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buongiorno';
        if (hour < 18) return 'Buon pomeriggio';
        return 'Buonasera';
    };

    const chartData = Object.entries(stats.ncByAspect).map(([name, value]) => ({ name, value })).sort((a,b) => a.value - b.value);

    const cards = [
        { label: 'Controlli Totali', value: stats.totalPca, color: 'blue', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
        { label: 'NC Aperte', value: stats.openNc, color: 'red', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: 'Check Eseguiti', value: stats.totalChecks, color: 'indigo', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { label: 'Conformità Media', value: stats.avgCompliance, color: 'green', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg> },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold">{getGreeting()}!</h2>
                <p className="text-slate-500 dark:text-slate-400">Ecco un riepilogo della situazione attuale.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {cards.map(card => <StatCard key={card.label} {...card} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Non Conformità per Aspetto (Periodici)</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={384}>
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(240, 240, 240, 0.5)' }} contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0.5rem'}}/>
                                <Bar dataKey="value" fill="#3b82f6" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">Nessuna Non Conformità registrata.</div>
                    )}
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Controlli Periodici da Eseguire</h3>
                    <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                        {frequencyStatuses.dueList.length > 0 ? (
                            frequencyStatuses.dueList.map(item => (
                                <div key={item.wbs} className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                    <div>
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{item.wbs}</span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2 hidden sm:inline">{WBS_DATA[item.wbs]?.descrizione || 'Sconosciuto'}</span>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.status.color}`}>
                                        {item.status.text}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-10">Tutti i controlli periodici sono aggiornati.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
