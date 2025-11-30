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
    const getUser = async () => {
      try {
        // Versuche mehrfach, die Session zu bekommen
        let user = null;
        for (let i = 0; i < 3; i++) {
          const { data: { user: userData, session }, error } = await supabase.auth.getUser();
          if (userData) {
            user = userData;
            break;
          }
          if (error && i === 2) {
            console.error('Error getting user after retries:', error);
            // Nur nach mehreren Versuchen redirecten
            setTimeout(() => {
              router.push('/login');
            }, 1000);
            return;
          }
          // Warte kurz zwischen Versuchen
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error('Error in getUser:', error);
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session && pathname !== '/login' && pathname !== '/register') {
        // Warte länger bevor Redirect - Session könnte noch gesetzt werden
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
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

