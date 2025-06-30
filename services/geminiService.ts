
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AISuggestion } from '../types';

// The API key is expected to be set in the environment variables.
if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. The AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface AnalysisContext {
    wbsInfo: string;
    activity: string;
    checkAspect: string;
    checkItem: string;
    userObservation: string;
}

export const analyzeNonConformity = async (context: AnalysisContext): Promise<AISuggestion> => {
    if (!process.env.API_KEY) {
        throw new Error("La chiave API di Google non è configurata.");
    }
    
    const { wbsInfo, activity, checkAspect, checkItem, userObservation } = context;
    
    const prompt = `
Sei un consulente ambientale esperto specializzato in grandi cantieri edili.
Analizza la seguente segnalazione di Non Conformità (NC) e fornisci una descrizione più dettagliata e professionale, insieme a 3 azioni correttive concrete e attuabili.

Contesto della Non Conformità:
- Area di Lavoro (WBS): ${wbsInfo}
- Attività in corso: ${activity}
- Aspetto Ambientale (PCA): ${checkAspect}
- Punto di Controllo Fallito: "${checkItem}"
- Osservazione Iniziale dell'Operatore: "${userObservation}"

Basandoti su questo contesto, elabora una risposta.
La tua risposta DEVE essere un oggetto JSON valido, senza alcuna formattazione aggiuntiva o markdown come i backtick.
La struttura del JSON deve essere la seguente:
{
  "suggested_description": "Una descrizione dettagliata e professionale della non conformità.",
  "corrective_actions": [
    "Prima azione correttiva suggerita.",
    "Seconda azione correttiva suggerita.",
    "Terza azione correttiva suggerita."
  ]
}
`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.5,
            },
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr) as AISuggestion;

        if (!parsedData.suggested_description || !Array.isArray(parsedData.corrective_actions)) {
            throw new Error("Risposta AI in un formato non valido.");
        }

        return parsedData;

    } catch (error) {
        console.error("Errore durante la chiamata all'API Gemini:", error);
        if (error instanceof Error && error.message.includes('API key not valid')) {
             throw new Error("Chiave API non valida. Controlla la configurazione.");
        }
        throw new Error("Impossibile ottenere suggerimenti dall'AI in questo momento.");
    }
};
