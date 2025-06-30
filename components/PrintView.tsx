
import React from 'react';
import { PcaReport } from '../types';
import { ALL_CHECK_TEMPLATES, WEATHER_CODE_MAP } from '../constants';

interface PrintViewProps {
    report: PcaReport;
}

export default function PrintView({ report }: PrintViewProps): React.ReactNode {
    const chrysasLogoUrl = 'https://raw.githubusercontent.com/fifich98/app-gestione-pca/main/LOGOCHRYSAS.bmp';
    const rtiLogoUrl = 'https://raw.githubusercontent.com/fifich98/app-gestione-pca/main/RTI.bmp';
    const typeLabels = { 'periodico': 'Controllo Periodico', 'preliminare': 'Ispezione Preliminare (Ante Operam)', 'finale': 'Ispezione Finale (Post Operam)' };

    const renderWeather = (weather: PcaReport['weather']) => {
        if (!weather) return '';
        const weatherInfo = WEATHER_CODE_MAP[weather.weather_code] || { text: 'N/D' };
        return (
            <div className="no-break mb-6">
                <h3 className="text-sm font-bold mb-2 border-b border-gray-300 pb-1">Condizioni Meteo</h3>
                <table className="text-xs w-full">
                    <tbody>
                        <tr>
                            <td className="p-1"><strong>Condizione:</strong> {weatherInfo.text}</td>
                            <td className="p-1"><strong>Temperatura:</strong> {weather.temperature_2m}°C</td>
                            <td className="p-1"><strong>Vento:</strong> {weather.wind_speed_10m.toFixed(1)} km/h</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div id="print-area-wrapper" className="hidden">
            <div className="text-black" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                {/* Header */}
                <div className="mb-8">
                     <table className="w-full border-b-2 border-black">
                        <tbody>
                            <tr>
                                <td className="w-1/2 text-left align-middle pb-2">
                                    <img src={chrysasLogoUrl} alt="Logo CHRYSAS" className="h-10" />
                                </td>
                                <td className="w-1/2 text-right align-middle pb-2">
                                    <img src={rtiLogoUrl} alt="Logo RTI" className="h-12" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Title */}
                <h1 className="text-center text-2xl font-bold">PIANO DI CONTROLLO AMBIENTALE</h1>
                <h2 className="text-center text-lg mb-8">Verbale di Controllo N° {report.id}</h2>

                {/* Main Info Table */}
                <table className="w-full border-collapse mb-6 text-sm">
                    <tbody>
                        <tr className="border border-gray-400">
                            <td className="p-2 font-bold bg-gray-100 w-1/4">Data</td>
                            <td className="p-2 w-1/4">{new Date(report.date + "T00:00:00").toLocaleDateString('it-IT')}</td>
                            <td className="p-2 font-bold bg-gray-100 w-1/4">WBS/Area</td>
                            <td className="p-2 w-1/4">{report.wbs || 'N.A.'}</td>
                        </tr>
                        <tr className="border border-gray-400">
                            <td className="p-2 font-bold bg-gray-100">Tipo Verbale</td>
                            <td className="p-2" colSpan={3}>{typeLabels[report.type] || 'N.D.'}</td>
                        </tr>
                        <tr className="border border-gray-400">
                            <td className="p-2 font-bold bg-gray-100">Lavorazione/Oggetto</td>
                            <td className="p-2" colSpan={3}>{report.activities || 'N.A.'}</td>
                        </tr>
                        <tr className="border border-gray-400">
                            <td className="p-2 font-bold bg-gray-100">Compilato da</td>
                            <td className="p-2" colSpan={3}>{report.inspector || 'N.D.'}</td>
                        </tr>
                    </tbody>
                </table>
                
                {renderWeather(report.weather)}

                {/* Checklists */}
                {Object.entries(report.checks).map(([templateId, checks]) => {
                    const template = ALL_CHECK_TEMPLATES.find(t => t.id === templateId);
                    if (!template || checks.length === 0) return null;
                    const observations = report.observations[templateId];
                    const photo = report.photos[templateId]?.['general'];

                    return (
                        <div key={templateId} className="no-break mb-8">
                            <h2 className="text-xl font-bold mb-2 border-b border-gray-600 pb-2 flex items-center">
                                <span className="text-2xl mr-3 align-middle">{template.icon}</span>{template.title}
                            </h2>
                            <table className="w-full text-sm">
                                <tbody>
                                    {checks.map((check, idx) => (
                                        <tr key={idx} className="border-b border-gray-200">
                                            <td className="py-2 pr-2 align-top">
                                                <p>{check.item}</p>
                                                {check.nc_observation && (
                                                    <div className="text-xs mt-1 p-2 bg-red-50 border-l-2 border-red-400">
                                                        <strong>Nota NC:</strong> {check.nc_observation}
                                                    </div>
                                                )}
                                            </td>
                                            <td className={`py-2 pl-2 w-16 text-center align-top font-bold ${check.result === 'NC' ? 'text-red-600' : ''}`}>{check.result || 'N.D.'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {(observations || photo) && (
                                <div className="no-break mt-4 bg-gray-50 p-3 border border-gray-200 rounded">
                                    <h3 className="font-bold text-sm mb-2">Osservazioni e Allegati</h3>
                                    {observations && <p className="text-xs whitespace-pre-wrap">{observations}</p>}
                                    {photo && <img src={photo} alt="Foto allegata" className="max-w-xs max-h-64 mt-2 border border-gray-300" />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
