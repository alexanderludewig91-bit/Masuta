'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      // Prüfe ob Supabase richtig konfiguriert ist
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL nicht konfiguriert. Bitte prüfe deine .env.local Datei.');
      }

      console.log('Attempting signup with URL:', supabaseUrl.substring(0, 30) + '...');

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('Supabase SignUp Error:', signUpError);
        console.error('Error details:', {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
        });
        
        // Benutzerfreundlichere Fehlermeldungen
        if (signUpError.message.includes('Failed to fetch') || signUpError.message.includes('ERR_NAME_NOT_RESOLVED')) {
          throw new Error('Verbindung zu Supabase fehlgeschlagen. Bitte prüfe:\n1. Ist die Supabase URL korrekt?\n2. Ist dein Internet verbunden?\n3. Existiert das Supabase Projekt noch?');
        }
        
        throw signUpError;
      }

      // User Progress wird automatisch durch Database Trigger erstellt
      // Keine manuelle Erstellung nötig

      router.push('/vocabulary');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'Registrierung fehlgeschlagen');
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
          placeholder="Mindestens 6 Zeichen"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Passwort bestätigen
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Passwort wiederholen"
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Wird registriert...' : 'Registrieren'}
      </Button>
    </form>
  );
}

