'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prüfe ob Supabase richtig konfiguriert ist
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL nicht konfiguriert. Bitte prüfe deine .env.local Datei.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase SignIn Error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        
        // Benutzerfreundlichere Fehlermeldungen
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('Verbindung zu Supabase fehlgeschlagen. Bitte prüfe:\n1. Ist die Supabase URL korrekt?\n2. Ist dein Internet verbunden?\n3. Existiert das Supabase Projekt noch?');
        }
        
        // Email-Bestätigung Fehler
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe dein Postfach auf eine Bestätigungs-E-Mail von Supabase.');
        }
        
        // Falsche Credentials
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          throw new Error('E-Mail oder Passwort falsch. Bitte versuche es erneut.');
        }
        
        throw new Error(error.message || 'Anmeldung fehlgeschlagen');
      }

      console.log('Login successful, user:', data.user?.id);
      console.log('Session data:', data.session ? 'exists' : 'missing');
      
      // Prüfe LocalStorage
      if (typeof window !== 'undefined') {
        const storageKey = 'supabase.auth.token';
        const stored = window.localStorage.getItem(storageKey);
        console.log('LocalStorage check:', stored ? 'has data' : 'empty', storageKey);
      }
      
      // Warte länger, damit die Session-Cookies gesetzt werden
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prüfe Session nochmal - mehrfach versuchen
      let session = null;
      for (let i = 0; i < 3; i++) {
        const { data: { session: sessionData } } = await supabase.auth.getSession();
        if (sessionData) {
          session = sessionData;
          break;
        }
        console.log(`Session check attempt ${i + 1}: missing, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('Session after login:', session ? 'exists' : 'missing');
      console.log('Session details:', session ? {
        user: session.user?.id,
        expires_at: session.expires_at,
        access_token: session.access_token ? 'exists' : 'missing',
      } : 'no session');
      
      // Prüfe LocalStorage nochmal
      if (typeof window !== 'undefined') {
        const storageKey = 'supabase.auth.token';
        const stored = window.localStorage.getItem(storageKey);
        console.log('LocalStorage after wait:', stored ? 'has data' : 'empty');
      }
      
      if (session) {
        // Verwende window.location.replace für zuverlässigere Weiterleitung
        console.log('Redirecting to /vocabulary...');
        // Warte noch etwas länger, damit Cookies sicher gesetzt sind
        await new Promise(resolve => setTimeout(resolve, 500));
        // Direkte Weiterleitung ohne Parameter
        window.location.replace('/vocabulary');
      } else {
        // Versuche es trotzdem - manchmal funktioniert es auch ohne Session im Client
        console.warn('Keine Session erkannt, versuche trotzdem weiterzuleiten...');
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.replace('/vocabulary');
      }
    } catch (error: any) {
      setError(error.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="deine@email.de"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Wird angemeldet...' : 'Anmelden'}
      </Button>
    </form>
  );
}

