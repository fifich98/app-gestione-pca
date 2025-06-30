
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PcaReport, ReportType, CheckItemTemplate, WeatherData, AISuggestion } from '../types';
import { WBS_DATA, CHECK_TEMPLATES_PERIODIC, CHECK_TEMPLATES_PRELIMINARE, CHECK_TEMPLATES_FINALE, ASPETTO_TO_PCA_ID_MAP } from '../constants';
import { usePcaStore } from '../hooks/usePcaStore';
import { fetchWeather } from '../services/weatherService';
import { analyzeNonConformity } from '../services/geminiService';
import { resizeImage } from '../utils/imageResizer';

// Helper components
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <input id={id} {...props} className="form-input block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
    </div>
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, id, children, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <select id={id} {...props} className="form-select block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
            {children}
        </select>
    </div>
);

const PhotoUploader: React.FC<{ photoKey: string; photoData: string | null; onUpload: (key: string, dataUrl: string) => void; onRemove: (key: string) => void }> = ({ photoKey, photoData, onUpload, onRemove }) => {
    const [isUploading, setIsUploading] = useState(false);
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const resized = await resizeImage(file, 1024);
            onUpload(photoKey, resized);
        } catch (error) {
            console.error("Photo upload error", error);
        } finally {
            setIsUploading(false);
        }
    };
    return (
        <div className="relative w-32 h-32">
            <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <div className="w-full h-full bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 transition">
                    {isUploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div> :
                     photoData ? <img src={photoData} alt="Preview" className="w-full h-full object-cover rounded-md" /> :
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" /></svg>}
                </div>
            </label>
            {photoData && (
                <button type="button" onClick={() => onRemove(photoKey)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg hover:bg-red-600 transition">&times;</button>
            )}
        </div>
    );
};

const SparkleIcon = ({ className = 'w-4 h-4' }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M10.868 2.884c.321-.772 1.415-.772 1.736 0l1.291 3.118c.16.386.518.644.93.644h3.284c.833 0 1.164.993.513 1.487l-2.656 1.93c-.328.238-.48.653-.382 1.05l1.006 3.848c.214.819-.684 1.487-1.396 1.01l-2.923-2.116c-.322-.233-.74-.233-1.062 0l-2.923 2.116c-.712.478-1.61-.192-1.396-1.01l1.006-3.848c.098-.397-.054-.812-.382-1.05L2.14 8.133c-.65-.494-.32-1.487.513-1.487h3.284c.412 0 .77-.258.93-.644l1.29-3.118z" clipRule="evenodd" /></svg>;

interface ChecklistProps {
    template: CheckItemTemplate;
    formState: any;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleRadioChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    photos: Record<string, string | null>;
    handlePhotoUpload: (key: string, dataUrl: string) => void;
    handlePhotoRemove: (key: string) => void;
    // AI props
    onAnalyze: (template: CheckItemTemplate, item: string, idx: number) => void;
    aiSuggestions: Record<string, AISuggestion | null>;
    aiLoading: Record<string, boolean>;
    aiError: Record<string, string | null>;
    onUseSuggestion: (templateId: string, itemIdx: number, type: 'description' | 'action', content: string) => void;
}

const ChecklistAccordion: React.FC<ChecklistProps> = ({ template, formState, handleInputChange, handleRadioChange, photos, handlePhotoUpload, handlePhotoRemove, onAnalyze, aiSuggestions, aiLoading, aiError, onUseSuggestion }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
            <header onClick={() => setIsOpen(!isOpen)} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-t-lg cursor-pointer">
                <h3 className="text-lg font-semibold flex items-center gap-3">{template.icon} {template.title}</h3>
                <svg className={`accordion-icon w-6 h-6 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </header>
            {isOpen && (
                <div className="accordion-content p-4 space-y-4">
                    {template.items.map((item, idx) => {
                        const checkName = `check_${template.id}_${idx}`;
                        const ncObservationName = `nc_observation_${template.id}_${idx}`;
                        const result = formState[checkName];
                        const isAiLoading = aiLoading[checkName];
                        const suggestion = aiSuggestions[checkName];
                        const error = aiError[checkName];
                        return (
                            <div key={idx} className="check-item-wrapper border-t border-slate-200 dark:border-slate-700 py-4 first:border-t-0 first:pt-0">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                                    <p className="mr-4 text-sm flex-1 pt-1">{item}</p>
                                    <div className="flex items-center gap-x-5 text-sm flex-shrink-0">
                                        {['C', 'NC', 'NA'].map(val => (
                                            <div key={val} className="flex items-center">
                                                <input type="radio" id={`${checkName}_${val}`} name={checkName} value={val} checked={result === val} onChange={handleRadioChange} className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                                <label htmlFor={`${checkName}_${val}`} className="ml-2 block">{val === 'C' ? 'Sì' : val === 'NC' ? 'No' : 'N.A.'}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {result === 'NC' && (
                                    <div className="nc-observation-wrapper mt-3 pl-4 border-l-2 border-red-500 space-y-3">
                                        <div>
                                            <label htmlFor={ncObservationName} className="text-sm font-medium text-red-700 dark:text-red-400">Dettaglio Non Conformità / Azione Correttiva</label>
                                            <textarea id={ncObservationName} name={ncObservationName} onChange={handleInputChange} value={formState[ncObservationName] || ''} className="mt-1 form-textarea block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm" rows={3} placeholder="Descrivere il problema o usare l'AI..."></textarea>
                                        </div>
                                        <div className="mt-2">
                                            <button type="button" onClick={() => onAnalyze(template, item, idx)} disabled={isAiLoading} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {isAiLoading 
                                                    ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Analizzando...</> 
                                                    : <><SparkleIcon className="w-4 h-4 mr-2" /> Analizza con AI</>
                                                }
                                            </button>
                                            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                                        </div>
                                        {suggestion && !isAiLoading && (
                                            <div className="mt-3 p-3 bg-indigo-50 dark:bg-slate-700/50 rounded-md space-y-4 text-sm animate-fade-in">
                                                <div>
                                                    <h5 className="font-semibold text-indigo-800 dark:text-indigo-300">Descrizione Suggerita</h5>
                                                    <p className="mt-1 text-slate-700 dark:text-slate-300 text-xs italic">"{suggestion.suggested_description}"</p>
                                                    <button type="button" onClick={() => onUseSuggestion(template.id, idx, 'description', suggestion.suggested_description)} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">Usa questa descrizione</button>
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-indigo-800 dark:text-indigo-300">Azioni Correttive Suggerite</h5>
                                                    <ul className="mt-1 space-y-2">
                                                        {suggestion.corrective_actions.map((action, actionIdx) => (
                                                            <li key={actionIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                                                <span className="flex-1"> • {action}</span>
                                                                <button type="button" onClick={() => onUseSuggestion(template.id, idx, 'action', action)} className="flex-shrink-0 text-blue-600 hover:underline font-semibold">+ Aggiungi</button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className="text-sm font-medium mb-2 block">Osservazioni Generali e Rilievo Fotografico</label>
                        <div className="flex flex-col md:flex-row gap-6">
                            <textarea name={`observation_${template.id}`} onChange={handleInputChange} value={formState[`observation_${template.id}`] || ''} className="flex-grow form-textarea block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm" rows={4} placeholder="Inserire osservazioni..."></textarea>
                            <PhotoUploader photoKey={`photo_${template.id}`} photoData={photos[`photo_${template.id}`]} onUpload={handlePhotoUpload} onRemove={handlePhotoRemove} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function NewPcaForm({ onSave, onCancel, showToast }: { onSave: (report: PcaReport) => void; onCancel: () => void; showToast: (msg: string, type: 'success' | 'error' | 'info') => void; }): React.ReactNode {
    const { getNextId } = usePcaStore();
    const [formState, setFormState] = useState<any>({
        type: 'periodico',
        date: new Date().toISOString().slice(0, 10),
    });
    const [isSaving, setIsSaving] = useState(false);
    const [photos, setPhotos] = useState<Record<string, string | null>>({});
    const [weather, setWeather] = useState<WeatherData | null>(null);
    
    // AI state
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion | null>>({});
    const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
    const [aiError, setAiError] = useState<Record<string, string | null>>({});


    useEffect(() => {
        const fetchAndSetWeather = async () => {
            try {
                const weatherData = await fetchWeather();
                setWeather(weatherData);
            } catch (error) {
                console.warn("Could not fetch weather for new report:", error);
            }
        };
        fetchAndSetWeather();
    }, []);
    
    useEffect(() => {
        const nextId = getNextId();
        const initialCheckState: any = {};
        [...CHECK_TEMPLATES_PERIODIC, ...CHECK_TEMPLATES_PRELIMINARE, ...CHECK_TEMPLATES_FINALE].forEach(template => {
            template.items.forEach((_, idx) => {
                initialCheckState[`check_${template.id}_${idx}`] = 'NA';
            });
        });
        
        setFormState(prev => ({ ...prev, id: nextId, ...initialCheckState }));
    }, [getNextId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState((prev: any) => ({ ...prev, [name]: value }));
    };
    
    const handlePhotoUpload = useCallback((key: string, dataUrl: string) => {
        setPhotos(prev => ({ ...prev, [key]: dataUrl }));
    }, []);

    const handlePhotoRemove = useCallback((key: string) => {
        setPhotos(prev => ({ ...prev, [key]: null }));
    }, []);

    const handleAiAnalysis = useCallback(async (template: CheckItemTemplate, item: string, idx: number) => {
        const checkName = `check_${template.id}_${idx}`;
        const ncObservationName = `nc_observation_${template.id}_${idx}`;
        const wbsCode = formState['wbs-input']?.substring(0, 2).toUpperCase();
        
        setAiLoading(prev => ({ ...prev, [checkName]: true }));
        setAiError(prev => ({ ...prev, [checkName]: null }));
        setAiSuggestions(prev => ({ ...prev, [checkName]: null }));

        try {
            const context = {
                wbsInfo: wbsCode ? `${wbsCode} - ${WBS_DATA[wbsCode]?.descrizione || 'N/D'}` : 'N/D',
                activity: formState.lavorazione || formState['activities-manual'] || 'N/D',
                checkAspect: template.title,
                checkItem: item,
                userObservation: formState[ncObservationName] || 'Nessuna osservazione iniziale.',
            };
            const suggestions = await analyzeNonConformity(context);
            setAiSuggestions(prev => ({ ...prev, [checkName]: suggestions }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
            setAiError(prev => ({ ...prev, [checkName]: errorMessage }));
            showToast(errorMessage, 'error');
        } finally {
            setAiLoading(prev => ({ ...prev, [checkName]: false }));
        }
    }, [formState, showToast]);

    const handleUseSuggestion = useCallback((templateId: string, itemIdx: number, type: 'description' | 'action', content: string) => {
        const ncObservationName = `nc_observation_${templateId}_${itemIdx}`;
        if (type === 'description') {
            setFormState(prev => ({ ...prev, [ncObservationName]: content }));
        } else {
            setFormState(prev => ({
                ...prev,
                [ncObservationName]: (prev[ncObservationName] ? prev[ncObservationName] + '\n\n' : '') + `Azione Correttiva: ${content}`
            }));
        }
    }, []);

    const visibleChecklists = useMemo((): CheckItemTemplate[] => {
        const type = formState.type as ReportType;
        if (type === 'preliminare') return CHECK_TEMPLATES_PRELIMINARE;
        if (type === 'finale') return CHECK_TEMPLATES_FINALE;
        if (type === 'periodico' && formState['wbs-input']) {
            const wbsCode = formState['wbs-input'].substring(0, 2).toUpperCase();
            const wbsData = WBS_DATA[wbsCode];
            if (wbsData) {
                const requiredPcaIds = new Set(wbsData.aspetti.map(a => ASPETTO_TO_PCA_ID_MAP[a]).filter(Boolean));
                return CHECK_TEMPLATES_PERIODIC.filter(t => requiredPcaIds.has(t.id));
            }
        }
        return [];
    }, [formState]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        if (!form.checkValidity()) {
            form.reportValidity();
            showToast('Compilare tutti i campi obbligatori.', 'error');
            return;
        }

        setIsSaving(true);
        const type = formState.type as ReportType;
        const report: PcaReport = {
            id: parseInt(formState.id),
            type: type,
            date: formState.date,
            inspector: type === 'periodico' ? formState['inspector-wbs'] : formState['inspector-manual'],
            wbs: type === 'periodico' ? formState['wbs-input'] : formState['wbs-manual'],
            activities: type === 'periodico' ? formState.lavorazione : formState['activities-manual'],
            weather: weather,
            checks: {},
            observations: {},
            photos: {},
        };

        const templatesToProcess = type === 'periodico' ? CHECK_TEMPLATES_PERIODIC : type === 'preliminare' ? CHECK_TEMPLATES_PRELIMINARE : CHECK_TEMPLATES_FINALE;
        
        templatesToProcess.forEach(template => {
            report.checks[template.id] = template.items.map((item, idx) => ({
                item: item,
                result: formState[`check_${template.id}_${idx}`] || 'NA',
                nc_observation: formState[`check_${template.id}_${idx}`] === 'NC' ? formState[`nc_observation_${template.id}_${idx}`] || null : null,
            }));
            report.observations[template.id] = formState[`observation_${template.id}`] || '';
            const photoKey = `photo_${template.id}`;
            if (photos[photoKey]) {
                if (!report.photos[template.id]) report.photos[template.id] = {};
                report.photos[template.id]['general'] = photos[photoKey]!;
            }
        });

        await onSave(report);
        setIsSaving(false);
        showToast('Controllo salvato con successo!', 'success');
        onCancel();
    };

    const wbsData = formState['wbs-input'] ? WBS_DATA[formState['wbs-input'].substring(0,2).toUpperCase()] : null;
    
    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">1. Dati Generali</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Verbale N°" id="id" name="id" type="number" value={formState.id || ''} onChange={handleInputChange} required />
                    <FormInput label="Data" id="date" name="date" type="date" value={formState.date || ''} onChange={handleInputChange} required />
                    <div className="md:col-span-2">
                        <FormSelect label="Tipo di Controllo" id="type" name="type" value={formState.type} onChange={handleInputChange} required>
                            <option value="periodico">Periodico (da WBS)</option>
                            <option value="preliminare">Preliminare (Ante Operam)</option>
                            <option value="finale">Finale (Post Operam)</option>
                        </FormSelect>
                    </div>
                </div>

                {formState.type === 'periodico' && (
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput label="1. Inserisci Codice WBS" id="wbs-input" name="wbs-input" value={formState['wbs-input'] || ''} onChange={handleInputChange} placeholder="Es. RI12, GA01..." required />
                            <FormSelect label="2. Seleziona Lavorazione" id="lavorazione" name="lavorazione" value={formState.lavorazione || ''} onChange={handleInputChange} disabled={!wbsData} required>
                                <option value="">-- Seleziona Lavorazione --</option>
                                {wbsData?.lavorazioni.map(lav => <option key={lav} value={lav}>{lav}</option>)}
                            </FormSelect>
                        </div>
                        <FormInput label="Compilatore" id="inspector-wbs" name="inspector-wbs" value={formState['inspector-wbs'] || ''} onChange={handleInputChange} placeholder="Nome e Funzione" required/>
                    </div>
                )}
                {formState.type !== 'periodico' && (
                     <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput label="Area di Riferimento" name="wbs-manual" value={formState['wbs-manual'] || ''} onChange={handleInputChange} placeholder="Es. Campo Base..." required />
                            <FormInput label="Compilatore" name="inspector-manual" value={formState['inspector-manual'] || ''} onChange={handleInputChange} placeholder="Nome e Funzione" required />
                        </div>
                        <div>
                             <label htmlFor="activities-manual" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Oggetto del controllo</label>
                             <textarea id="activities-manual" name="activities-manual" value={formState['activities-manual'] || ''} onChange={handleInputChange} className="form-textarea w-full" rows={2} placeholder="Es. Verifica stato luoghi..." required></textarea>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">2. Checklist di Controllo</h2>
                <div className="space-y-4">
                    {visibleChecklists.length > 0 ? visibleChecklists.map(template => (
                         <ChecklistAccordion key={template.id} template={template} formState={formState} handleInputChange={handleInputChange} handleRadioChange={handleRadioChange} photos={photos} handlePhotoUpload={handlePhotoUpload} handlePhotoRemove={handlePhotoRemove} onAnalyze={handleAiAnalysis} aiSuggestions={aiSuggestions} aiLoading={aiLoading} aiError={aiError} onUseSuggestion={handleUseSuggestion} />
                    )) : (
                        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg text-slate-500">
                           {formState.type === 'periodico' ? 'Inserisci un codice WBS valido per caricare le checklist.' : 'Checklist caricate per il tipo di controllo.'}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-6 py-3 bg-slate-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold transition">Annulla</button>
                <button type="submit" disabled={isSaving} className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold flex items-center justify-center transition disabled:opacity-50">
                    {isSaving ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Salvando...</> : 'Salva Controllo'}
                </button>
            </div>
        </form>
    );
}