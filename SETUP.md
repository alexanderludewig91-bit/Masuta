# Setup-Anleitung für Masuta

## 1. Supabase Setup

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein kostenloses Konto
2. Erstelle ein neues Projekt
3. Gehe zum SQL Editor
4. Kopiere den Inhalt von `supabase/schema.sql` und führe ihn aus
5. Gehe zu Settings > API
6. Kopiere die "Project URL" und "anon public" Key

## 2. Gemini API Setup

1. Gehe zu [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Melde dich mit deinem Google-Konto an
3. Klicke auf "Create API Key"
4. Kopiere den API Key

**Wichtig**: Gemini bietet ein großzügiges kostenloses Kontingent!

## 3. Environment Variables

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=your_gemini_api_key
```

## 4. Installation

```bash
npm install
```

## 5. Development Server

```bash
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

## 6. PWA Icons (Optional)

Für die PWA benötigst du Icons:
- `public/icon-192.png` (192x192 Pixel)
- `public/icon-512.png` (512x512 Pixel)

Du kannst diese mit einem Tool wie [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) erstellen.

## 7. Deployment

### Vercel (empfohlen)

1. Installiere Vercel CLI: `npm i -g vercel`
2. Führe `vercel` aus
3. Setze die Environment Variables in der Vercel Console
4. Deploy!

Die App ist dann als PWA installierbar.

## Troubleshooting

### "Gemini API Key nicht konfiguriert"
- Stelle sicher, dass `GEMINI_API_KEY` in `.env.local` gesetzt ist
- Starte den Dev-Server neu nach dem Hinzufügen von Environment Variables

### "Nicht angemeldet" Fehler
- Stelle sicher, dass Supabase richtig konfiguriert ist
- Prüfe die Browser Console für detaillierte Fehler

### Datenbank-Fehler
- Stelle sicher, dass das SQL-Schema in Supabase ausgeführt wurde
- Prüfe die Row Level Security (RLS) Policies

