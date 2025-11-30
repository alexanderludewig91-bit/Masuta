# Troubleshooting Guide

## Problem: ERR_NAME_NOT_RESOLVED bei Supabase

Wenn du den Fehler `ERR_NAME_NOT_RESOLVED` oder `Failed to fetch` bei der Registrierung/Anmeldung siehst, prüfe folgendes:

### 1. Supabase URL prüfen

Die Supabase URL sollte so aussehen:
```
https://abcdefghijklmnop.supabase.co
```

**Wichtig:**
- Muss mit `https://` beginnen
- Muss auf `.supabase.co` enden
- Keine zusätzlichen Pfade wie `/auth` oder `/rest`
- Keine Leerzeichen oder Anführungszeichen

### 2. Supabase Projekt Status prüfen

1. Gehe zu [supabase.com](https://supabase.com)
2. Logge dich ein
3. Prüfe ob dein Projekt noch aktiv ist
4. Gehe zu Settings > API
5. Kopiere die **Project URL** (nicht die andere URL!)

### 3. Environment Variables prüfen

Öffne `http://localhost:3000/api/health` im Browser. Es sollte zeigen:
```json
{
  "supabase": {
    "url": "✅ Konfiguriert",
    "key": "✅ Konfiguriert"
  }
}
```

### 4. .env.local Format prüfen

Die `.env.local` Datei sollte so aussehen:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODU2Nzg5MCwiZXhwIjoxOTU0MTQzODkwfQ.abcdefghijklmnopqrstuvwxyz1234567890
GEMINI_API_KEY=your_gemini_api_key
```

**Wichtig:**
- Keine Anführungszeichen um die Werte
- Keine Leerzeichen um das `=`
- Jede Variable auf einer eigenen Zeile
- Keine Kommentare mit `#` (kann Probleme verursachen)

### 5. Server neu starten

Nach Änderungen an `.env.local`:
1. Stoppe den Server (Strg+C)
2. Starte neu: `npm run dev`

### 6. Browser Cache leeren

Manchmal cached der Browser alte Werte:
- Strg+Shift+R (Hard Reload)
- Oder DevTools öffnen > Network Tab > "Disable cache" aktivieren

### 7. Supabase Projekt neu erstellen

Falls nichts hilft:
1. Erstelle ein neues Supabase Projekt
2. Kopiere die neue URL und den Key
3. Aktualisiere `.env.local`
4. Führe das SQL-Schema erneut aus

### 8. Debug-Route testen

Öffne `http://localhost:3000/api/debug-supabase` im Browser. Das zeigt:
- Ob die URL korrekt formatiert ist
- Ob eine Verbindung möglich ist
- Detaillierte Fehlermeldungen

### Häufige Fehler

**Falsch:**
```env
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"  # Anführungszeichen
NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co  # Leerzeichen
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co/rest/v1  # Falscher Pfad
```

**Richtig:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

