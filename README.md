# App Gestione PCA - CHRYSAS

Una applicazione web per la gestione dei Piani di Controllo Ambientale (PCA) per i cantieri. Permette agli operatori di eseguire controlli, registrare non conformità, gestire i verbali e monitorare lo stato di avanzamento delle attività ambientali.

L'applicazione è progettata per funzionare completamente offline dopo il primo caricamento, utilizzando IndexedDB per la persistenza dei dati.

## ✨ Funzionalità

- **Dashboard Riepilogativa**: Visualizzazione rapida delle statistiche chiave, come il numero di controlli, le non conformità aperte, e la conformità media.
- **Grafici Interattivi**: Un grafico a barre mostra le non conformità raggruppate per aspetto ambientale.
- **Assistente AI per Non Conformità**: Utilizza l'API di Google Gemini per analizzare le non conformità, suggerire descrizioni dettagliate e proporre azioni correttive, velocizzando la compilazione e standardizzando i dati.
- **Gestione Controlli**: Creazione di nuovi verbali di controllo (Periodici, Preliminari, Finali).
- **Checklist Dinamiche**: Le checklist si adattano dinamicamente in base al tipo di lavoro (WBS) selezionato.
- **Lista Verbali**: Elenco di tutti i controlli eseguiti, raggruppati per WBS, con la possibilità di stamparli o eliminarli.
- **Stato Scadenze**: Monitoraggio visivo dello stato dei controlli periodici (Scaduto, In Scadenza, OK).
- **Upload Foto**: Possibilità di allegare una foto per ogni checklist.
- **Stampa Verbali**: Generazione di un report in formato A4 stampabile per ogni controllo.
- **Import/Export Dati**: Funzionalità di backup e ripristino dei dati in formato JSON.
- **Tema Scuro/Chiaro**: Interfaccia utente con tema light e dark.
- **Widget Meteo**: Visualizzazione delle condizioni meteo attuali basate sulla geolocalizzazione.
- **Responsive & Offline**: Progettata per essere utilizzabile su dispositivi mobili e senza connessione a internet.

## 🛠️ Tecnologie Utilizzate

- **React 19**: Libreria principale per la costruzione dell'interfaccia utente.
- **TypeScript**: Per la tipizzazione statica e una maggiore robustezza del codice.
- **Google Gemini API**: Per le funzionalità di intelligenza artificiale generativa.
- **Tailwind CSS**: Framework CSS per uno stile rapido e moderno.
- **Recharts**: Per la creazione di grafici interattivi.
- **idb-keyval**: Una semplice utility per l'utilizzo di IndexedDB.
- **Nessun Build Step**: L'applicazione viene eseguita direttamente nel browser utilizzando i moduli ES e un `importmap` per la gestione delle dipendenze via CDN.

## 🚀 Installazione ed Esecuzione

Dato che l'applicazione non richiede un processo di build, è sufficiente servirla tramite un qualsiasi server web statico.

1.  **Clona il repository:**
    ```bash
    git clone <URL_DEL_REPOSITORY>
    cd <NOME_DELLA_CARTELLA>
    ```

2.  **Imposta la Chiave API (necessario per le funzioni AI):**
    Per utilizzare le funzionalità dell'assistente AI, è necessario impostare una chiave API di Google Gemini. Questo viene gestito tramite una variabile d'ambiente che deve essere disponibile nel contesto di esecuzione. L'applicazione si aspetta di trovare la chiave in `process.env.API_KEY`.

3.  **Avvia un server web locale.**
    Se hai Python installato, puoi usare il suo modulo `http.server`:
    ```bash
    python -m http.server
    ```
    Altrimenti, se hai Node.js, puoi usare `serve`:
    ```bash
    # Installa serve globalmente (se non l'hai già fatto)
    npm install -g serve
    # Avvia il server
    serve .
    ```

4.  Apri il tuo browser e naviga all'indirizzo fornito dal server (solitamente `http://localhost:8000` o `http://localhost:3000`).

## ⚙️ Struttura del Progetto

```
.
├── components/         # Componenti React riutilizzabili
├── hooks/              # Custom Hooks di React (es. per la gestione dello store)
├── services/           # Logica per interagire con API esterne (es. meteo, Gemini)
├── utils/              # Funzioni di utilità (es. ridimensionamento immagini)
├── constants.tsx       # Dati di configurazione statici e costanti
├── types.ts            # Definizioni dei tipi TypeScript
├── App.tsx             # Componente radice dell'applicazione
├── index.html          # File HTML principale
├── index.tsx           # Punto di ingresso dell'applicazione React
├── README.md           # Questo file
└── metadata.json       # Metadati dell'app
```