# AI Fashion Shooting Studio

Applicazione full-stack basata su Next.js 14 per trasformare foto di manichini e capi appesi in shooting e-commerce coerenti con Gemini 2.5 Flash Image.

## Requisiti
- Node.js 20+
- Chiave API Gemini configurata in `.env.local`

## Setup
1. Installazione dipendenze
   ```bash
   npm install
   ```
2. Configurare le variabili ambiente copiando `.env.example`
   ```bash
   cp .env.example .env.local
   ```
   Compilare `GEMINI_API_KEY` e, se necessario, personalizzare il percorso dello storage o del database SQLite.
3. Generare il client Prisma
   ```bash
   npm run prisma:generate
   ```
4. Avviare il server di sviluppo
   ```bash
   npm run dev
   ```

L'applicazione è disponibile su [http://localhost:3000](http://localhost:3000).

## Funzionalità principali
- Upload massivo con ordinamento cronologico e analisi automatica tramite Gemini vision.
- Editor dei blocchi outfit/varianti con override dei ruoli front/side/back/detail.
- Mappatura categorie, codici articolo e associazione varianti colore.
- Generazione shooting coerente (identità modella, luci, background #E6DFD3) con pipeline di prompt strutturata.
- Chat operativa, gestione stop/resume job, rigenerazione puntuale e download zip per outfit/capo.
- Salvataggio di metadati, log e percorsi file tramite Prisma/SQLite.

## Struttura cartelle
- `app/` – App Router e API routes.
- `components/` – Componenti UI client-side.
- `lib/` – Helpers (Gemini SDK, storage, pipeline di generazione, job manager, colori, Prisma).
- `prisma/` – Schema del database.
- `types/` – Tipi condivisi tra client e server.

## Note
- Le immagini vengono memorizzate su filesystem locale (`/tmp/uploads` e `/tmp/outputs` per default). Personalizzare tramite variabili ambiente se necessario.
- L'esecuzione dei job utilizza `p-queue` con concorrenza configurabile (`JOB_CONCURRENCY`).
- In assenza di chiave Gemini le richieste AI falliranno: il sistema registra comunque gli errori per eventuali retry.
