
import React, { useState, useEffect } from 'react';
import { WeatherData } from '../types';
import { WEATHER_CODE_MAP } from '../constants';
import { fetchWeather } from '../services/weatherService';

interface HeaderProps {
    pageTitle: string;
    onToggleSidebar: () => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
}

const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getWeather = async () => {
            try {
                const data = await fetchWeather();
                setWeather(data);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred.');
                }
            } finally {
                setLoading(false);
            }
        };
        getWeather();
    }, []);

    if (loading) {
        return <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin"></div>
            <span>Carico meteo...</span>
        </div>
    }

    if (error) {
        return <span className="text-sm text-yellow-600 dark:text-yellow-400">{error}</span>
    }

    if (!weather) return null;

    const weatherInfo = WEATHER_CODE_MAP[weather.weather_code] || { text: 'N/D', icon: '❓' };

    return (
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span title={weatherInfo.text} className="text-xl">{weatherInfo.icon}</span>
            <span className="font-semibold">{weather.temperature_2m}°C</span>
            <span className="hidden xl:inline-flex items-center gap-1" title="Vento">{weather.wind_speed_10m.toFixed(1)} km/h</span>
        </div>
    );
}

export default function Header({ pageTitle, onToggleSidebar, theme, setTheme }: HeaderProps): React.ReactNode {
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }, []);
    
    return (
        <header className="h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-50 flex-shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 lg:hidden" aria-label="Toggle Menu">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
                <div className="hidden lg:flex"><WeatherWidget /></div>

                <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400" aria-label="Toggle dark mode">
                    {theme === 'light' ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 7.072l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414zM3 11a1 1 0 100-2H2a1 1 0 100 2h1z" fillRule="evenodd" clipRule="evenodd"></path></svg>
                    )}
                </button>
                <div className="text-right hidden sm:block">
                    <span className="text-sm text-slate-500 dark:text-slate-400">{currentDate}</span>
                </div>
            </div>
        </header>
    );
}
