
import { WeatherData } from '../types';

export const fetchWeather = (): Promise<WeatherData> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error('Geolocalizzazione non supportata.'));
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}&current=temperature_2m,precipitation,weather_code,wind_speed_10m`;
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error('Risposta API meteo non valida');
                    const data = await response.json();
                    if (data && data.current) {
                        resolve(data.current as WeatherData);
                    } else {
                        reject(new Error("Dati meteo non trovati nella risposta."));
                    }
                } catch (error) {
                    console.error("Errore API meteo:", error);
                    reject(new Error('Meteo non disponibile.'));
                }
            },
            (error) => {
                console.warn("Errore geolocalizzazione:", error.message);
                reject(new Error('Geolocalizzazione negata.'));
            }
        );
    });
};
