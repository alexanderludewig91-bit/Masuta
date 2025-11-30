'use client';

import { createClient } from '@supabase/supabase-js';

// Supabase Client für Client-Side Components
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    const error = 'Missing Supabase environment variables. Please check your .env.local file.';
    console.error(error, {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    throw new Error(error);
  }

  // Validiere URL Format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl.substring(0, 50)}...`);
  }
  
  // Custom Storage-Adapter für bessere Browser-Kompatibilität
  const getStorage = () => {
    if (typeof window === 'undefined') return undefined;
    
    try {
      // Teste ob localStorage verfügbar ist
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return window.localStorage;
    } catch (e) {
      console.warn('localStorage nicht verfügbar, verwende Memory Storage');
      // Fallback: Memory Storage
      return {
        getItem: (key: string) => null,
        setItem: (key: string, value: string) => {},
        removeItem: (key: string) => {},
      };
    }
  };

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: getStorage(),
      storageKey: 'supabase.auth.token',
      flowType: 'pkce', // PKCE Flow für bessere Sicherheit und Kompatibilität
    },
    global: {
      headers: {
        'x-client-info': 'masuta-app',
      },
    },
  });

  return client;
};

// Singleton instance
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: return a new instance each time
    return createSupabaseClient();
  }
  
  // Client-side: use singleton
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance;
})();

