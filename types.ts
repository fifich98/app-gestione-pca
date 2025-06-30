
export type TabId = 'dashboard' | 'lista-pca' | 'nuovo-pca' | 'impostazioni';

export interface Tab {
    id: TabId;
    label: string;
    icon: (props: { className?: string }) => React.ReactNode;
}

export type Significance = 'ALTA' | 'MEDIA' | 'BASSA';

export interface WBSData {
    descrizione: string;
    lavorazioni: string[];
    aspetti: string[];
}

export interface CheckItemTemplate {
    id: string;
    title: string;
    icon: string;
    significativita?: Significance;
    items: string[];
}

export interface PcaCheck {
    item: string;
    result: 'C' | 'NC' | 'NA';
    nc_observation: string | null;
}

export interface WeatherData {
    temperature_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
}

export type ReportType = 'periodico' | 'preliminare' | 'finale';

export interface PcaReport {
    id: number;
    type: ReportType;
    date: string; // YYYY-MM-DD
    inspector: string;
    wbs: string;
    activities: string;
    weather: WeatherData | null;
    checks: Record<string, PcaCheck[]>; // key: templateId
    observations: Record<string, string>; // key: templateId
    photos: Record<string, Record<string, string>>; // key: templateId, nested key: checkId/general, value: dataUrl
}

export interface ModalConfig {
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onClose: (result: boolean) => void;
    needsConfirmation?: boolean;
    confirmationText?: string;
}

export interface FrequencyStatus {
    text: string;
    color: string;
    icon: string;
    nextDate: Date | null;
}

export interface DueListItem {
    wbs: string;
    status: FrequencyStatus;
    days: number;
}

export interface AISuggestion {
    suggested_description: string;
    corrective_actions: string[];
}