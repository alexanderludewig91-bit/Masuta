# Masuta - Japanisch Lern-App

Eine Progressive Web App (PWA) zum Japanisch-Lernen mit intelligentem Vokabeltraining, Spaced Repetition System und Gamification.

## Features

- 🇩🇪↔️🇯🇵 **Übersetzung**: Deutsch-Japanisch Übersetzung mit Gemini AI (inkl. Hiragana/Katakana und Beispielsätze)
- 📚 **Vokabelliste**: Vokabeln verwalten, bearbeiten und kategorisieren
- 🎯 **Training**: Drei Trainings-Modi (Multiple Choice, Texteingabe, Karteikarten)
- 🧠 **Spaced Repetition**: Intelligentes Wiederholungssystem basierend auf SM-2 Algorithmus
- 🎮 **Gamification**: Punkte, Level, Streaks und Achievements
- 📊 **Statistiken**: Detaillierte Lernstatistiken und Fortschritts-Tracking
- 📱 **PWA**: Installierbar auf Smartphone und PC, funktioniert offline

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Übersetzung**: Google Gemini AI
- **Charts**: Recharts
- **Animations**: Framer Motion

## Setup

### 1. Dependencies installieren

```bash
npm install
```

### 2. Environment Variables

Erstelle eine `.env.local` Datei:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Supabase Setup

1. Erstelle ein Supabase Projekt auf [supabase.com](https://supabase.com)
2. Führe das SQL-Schema aus (`supabase/schema.sql`) in der Supabase SQL Editor aus
3. Kopiere die URL und Anon Key in die `.env.local`

### 4. Gemini API

1. Erstelle einen Gemini API Key auf [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Füge den Key zur `.env.local` hinzu

### 5. Development Server starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Datenbank-Schema

Die App verwendet folgende Tabellen:

- `vocabularies` - Vokabeln
- `vocabulary_categories` - Kategorien/Tags
- `vocabulary_category_relations` - Many-to-Many Relation
- `learning_stats` - Lernstatistiken für SRS
- `user_progress` - Gamification Daten
- `translation_cache` - Cache für Übersetzungen

## Deployment

### Vercel (empfohlen)

1. Push zum Git Repository
2. Verbinde mit Vercel
3. Setze Environment Variables
4. Deploy

Die App ist dann als PWA installierbar.

## PWA Installation

### Smartphone
1. Öffne die App im Browser
2. Tippe auf "Zum Startbildschirm hinzufügen" (iOS) oder "App installieren" (Android)

### Desktop
1. Öffne die App im Browser
2. Klicke auf das Install-Icon in der Adressleiste

## Lizenz

MIT

