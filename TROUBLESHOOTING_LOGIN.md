# Login-Problem beheben

## Problem: Login funktioniert nicht - nichts passiert

### 1. Browser-Konsole prüfen

Öffne die Browser-Konsole (F12 > Console) und versuche dich einzuloggen. Schaue nach:
- Fehlermeldungen
- "Login successful" Nachricht
- "Session after login" Nachricht

### 2. Email-Bestätigung prüfen

Supabase erfordert möglicherweise eine Email-Bestätigung:

1. Gehe zu Supabase Console > Authentication > Settings
2. Prüfe ob "Enable email confirmations" aktiviert ist
3. **Für Entwicklung**: Deaktiviere es temporär
4. **Für Produktion**: Prüfe dein Email-Postfach auf eine Bestätigungs-Email

### 3. Supabase Auth Settings prüfen

In Supabase Console > Authentication > Settings:
- "Enable email signup" sollte aktiviert sein
- "Enable email confirmations" - für Entwicklung deaktivieren
- "Site URL" sollte auf `http://localhost:3000` gesetzt sein (für Entwicklung)

### 4. Session Storage prüfen

Öffne Browser DevTools > Application > Local Storage
- Prüfe ob `sb-<project-id>-auth-token` existiert nach dem Login
- Falls nicht, wird die Session nicht gespeichert

### 5. Middleware prüfen

Die Middleware könnte die Weiterleitung blockieren. Prüfe:
- Ob `/vocabulary` erreichbar ist nach dem Login
- Ob es eine Redirect-Schleife gibt

### 6. Hard Reload

Nach Code-Änderungen:
- Strg+Shift+R (Hard Reload)
- Oder DevTools > Network > "Disable cache" aktivieren

