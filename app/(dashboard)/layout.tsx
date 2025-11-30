'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout | null = null;
    let checkCount = 0;
    const MAX_CHECKS = 5;

    const checkAuth = async () => {
      if (!mounted) return;
      
      try {
        // Prüfe Session mehrfach mit verschiedenen Methoden
        let user = null;
        let session = null;
        
        // Methode 1: getSession
        const { data: { session: sessionData } } = await supabase.auth.getSession();
        if (sessionData?.user) {
          session = sessionData;
          user = sessionData.user;
        }
        
        // Methode 2: getUser (falls getSession fehlschlägt)
        if (!user) {
          const { data: { user: userData } } = await supabase.auth.getUser();
          if (userData) {
            user = userData;
          }
        }
        
        // Methode 3: Prüfe localStorage direkt (für Chrome/Brave)
        if (!user && typeof window !== 'undefined') {
          try {
            const storageKey = 'supabase.auth.token';
            const stored = window.localStorage.getItem(storageKey);
            if (stored) {
              // Versuche Session nochmal zu bekommen nach localStorage-Check
              await new Promise(resolve => setTimeout(resolve, 100));
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (retrySession?.user) {
                user = retrySession.user;
                session = retrySession;
              }
            }
          } catch (e) {
            // Ignoriere localStorage-Fehler
          }
        }
        
        if (mounted) {
          if (user) {
            setUser(user);
            setLoading(false);
            // Lösche Redirect-Timeout wenn User gefunden
            if (redirectTimeout) {
              clearTimeout(redirectTimeout);
              redirectTimeout = null;
            }
          } else {
            checkCount++;
            setLoading(false);
            
            // Nur redirecten nach mehreren fehlgeschlagenen Versuchen
            if (checkCount >= MAX_CHECKS) {
              if (redirectTimeout) {
                clearTimeout(redirectTimeout);
              }
              redirectTimeout = setTimeout(() => {
                if (mounted) {
                  // Finale Prüfung vor Redirect
                  supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
                    if (mounted && !finalSession?.user) {
                      router.push('/login');
                    }
                  });
                }
              }, 1000);
            } else {
              // Versuche es nochmal nach kurzer Pause
              setTimeout(() => {
                if (mounted) {
                  checkAuth();
                }
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error in checkAuth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Starte Auth-Check
    checkAuth();

    // Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
          checkCount = 0; // Reset counter wenn Session gefunden
          
          // Lösche Redirect-Timeout
          if (redirectTimeout) {
            clearTimeout(redirectTimeout);
            redirectTimeout = null;
          }
        } else {
          // Session verloren - aber warte etwas bevor Redirect
          if (pathname !== '/login' && pathname !== '/register') {
            if (redirectTimeout) {
              clearTimeout(redirectTimeout);
            }
            redirectTimeout = setTimeout(() => {
              if (mounted) {
                // Finale Prüfung
                supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
                  if (mounted && !finalSession?.user) {
                    router.push('/login');
                  }
                });
              }
            }, 3000); // Längere Wartezeit für Chrome/Brave
          }
        }
      }
    });

    return () => {
      mounted = false;
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-800">Lädt...</div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-800">Nicht angemeldet. Weiterleitung...</div>
      </div>
    );
  }

  const navItems = [
    { href: '/vocabulary', label: 'Vokabeln' },
    { href: '/translate', label: 'Übersetzen' },
    { href: '/train', label: 'Training' },
    { href: '/statistics', label: 'Statistiken' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/vocabulary" className="text-2xl font-bold text-blue-600">
                  Masuta
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-700 hover:border-gray-300 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Abmelden
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="sm:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-800 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

