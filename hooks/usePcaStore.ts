
import { useState, useEffect, useCallback, useMemo } from 'react';
import { get, set, del, createStore } from 'idb-keyval';
import { PcaReport, FrequencyStatus, DueListItem, Significance } from '../types';
import { WBS_DATA, CHECK_TEMPLATES_PERIODIC, ASPETTO_TO_PCA_ID_MAP, FREQUENCY_MAP } from '../constants';

const DB_KEY = 'pca_app_data_v1';
const dbStore = createStore('pca-db', 'reports');

export const usePcaStore = () => {
    const [reports, setReports] = useState<PcaReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const storedReports = await get<PcaReport[]>(DB_KEY, dbStore);
                setReports(storedReports || []);
            } catch (error) {
                console.error("Failed to load data from IndexedDB", error);
                setReports([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const saveData = useCallback(async (newReports: PcaReport[]) => {
        try {
            await set(DB_KEY, newReports, dbStore);
            setReports(newReports);
        } catch (error) {
            console.error("Failed to save data to IndexedDB", error);
        }
    }, []);

    const addReport = useCallback(async (report: PcaReport) => {
        const newReports = [...reports];
        const existingIndex = newReports.findIndex(r => r.id === report.id);
        if (existingIndex !== -1) {
            newReports[existingIndex] = report;
        } else {
            newReports.push(report);
        }
        await saveData(newReports);
    }, [reports, saveData]);

    const deleteReport = useCallback(async (reportId: number) => {
        const newReports = reports.filter(r => r.id !== reportId);
        await saveData(newReports);
    }, [reports, saveData]);

    const getNextId = useCallback((): number => {
        if (reports.length === 0) return 1;
        return Math.max(...reports.map(r => r.id)) + 1;
    }, [reports]);

    const wbsSignificanceMap = useMemo(() => {
        const significanceValues: Record<Significance, number> = { 'ALTA': 2, 'MEDIA': 1, 'BASSA': 0 };
        const map: Record<string, Significance> = {};
        for (const wbsCode in WBS_DATA) {
            const wbsInfo = WBS_DATA[wbsCode];
            let maxSignificance = -1;
            const requiredPcaIds = new Set(wbsInfo.aspetti.map(a => ASPETTO_TO_PCA_ID_MAP[a]).filter(Boolean));
            requiredPcaIds.forEach(pcaId => {
                const template = CHECK_TEMPLATES_PERIODIC.find(t => t.id === pcaId);
                if (template?.significativita) {
                    const sigValue = significanceValues[template.significativita];
                    if (sigValue > maxSignificance) {
                        maxSignificance = sigValue;
                    }
                }
            });
            const significanceKey = Object.keys(significanceValues).find(key => significanceValues[key as Significance] === maxSignificance) as Significance | undefined;
            if (significanceKey) {
                map[wbsCode] = significanceKey;
            }
        }
        return map;
    }, []);

    const getDashboardStats = useCallback(() => {
        let openNc = 0, totalChecks = 0, compliantChecks = 0;
        const ncByAspect: Record<string, number> = {};

        reports.forEach(report => {
            if (report.type === 'periodico' && report.checks) {
                Object.entries(report.checks).forEach(([aspectId, aspectChecks]) => {
                    const template = CHECK_TEMPLATES_PERIODIC.find(t => t.id === aspectId);
                    if (!template) return;
                    aspectChecks.forEach(check => {
                        if (check.result && check.result !== 'NA') {
                            totalChecks++;
                            if (check.result === 'C') compliantChecks++;
                            if (check.result === 'NC') {
                                openNc++;
                                const aspectTitle = template.title.substring(template.title.indexOf(':') + 1).trim();
                                ncByAspect[aspectTitle] = (ncByAspect[aspectTitle] || 0) + 1;
                            }
                        }
                    });
                });
            }
        });
        const avgCompliance = totalChecks > 0 ? `${((compliantChecks / totalChecks) * 100).toFixed(0)}%` : 'N.D.';
        return { totalPca: reports.length, openNc, totalChecks, avgCompliance, ncByAspect };
    }, [reports]);

    const getFrequencyStatuses = useCallback(() => {
        const latestReportByWbs: Record<string, PcaReport> = {};
        [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach(r => {
            if (r.type === 'periodico' && r.wbs) {
                const wbsCode = r.wbs.substring(0, 2).toUpperCase();
                if (!latestReportByWbs[wbsCode]) {
                    latestReportByWbs[wbsCode] = r;
                }
            }
        });

        const statusMap: Record<string, FrequencyStatus> = {};
        const dueList: DueListItem[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (const wbsCode in wbsSignificanceMap) {
            const significance = wbsSignificanceMap[wbsCode];
            if (!significance) continue;

            const report = latestReportByWbs[wbsCode];
            const interval = FREQUENCY_MAP[significance].days;

            if (report) {
                const lastDate = new Date(report.date);
                const dueDate = new Date(lastDate.setDate(lastDate.getDate() + interval));
                const daysDiff = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

                let status: FrequencyStatus;
                if (daysDiff < 0) {
                    status = { text: 'Scaduto', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: '🔥', nextDate: dueDate };
                    dueList.push({ wbs: wbsCode, status, days: Math.round(daysDiff) });
                } else if (daysDiff <= 3) {
                    status = { text: 'In Scadenza', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: '⚠️', nextDate: dueDate };
                    dueList.push({ wbs: wbsCode, status, days: Math.round(daysDiff) });
                } else {
                    status = { text: 'OK', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: '✅', nextDate: dueDate };
                }
                statusMap[wbsCode] = status;
            } else {
                const status: FrequencyStatus = { text: 'Da Eseguire', color: 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-300', icon: '➡️', nextDate: null };
                statusMap[wbsCode] = status;
                dueList.push({ wbs: wbsCode, status, days: -Infinity });
            }
        }
        dueList.sort((a, b) => a.days - b.days);
        return { statusMap, dueList };
    }, [reports, wbsSignificanceMap]);

    const clearAllData = useCallback(async () => {
        await del(DB_KEY, dbStore);
        setReports([]);
    }, []);

    const importData = useCallback(async (file: File) => {
        const text = await file.text();
        const data = JSON.parse(text) as PcaReport[];
        if (!Array.isArray(data)) throw new Error("File di backup non valido");
        await saveData(data);
    }, [saveData]);

    const exportData = useCallback(() => {
        const dataStr = JSON.stringify(reports, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pca_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [reports]);

    return {
        reports,
        isLoading,
        addReport,
        deleteReport,
        getNextId,
        getDashboardStats,
        getFrequencyStatuses,
        clearAllData,
        importData,
        exportData,
    };
};
