import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req, res });

    // Versuche Session zu bekommen
    let session = null;
    let error = null;
    
    try {
      const result = await supabase.auth.getSession();
      session = result.data?.session ?? null;
      error = result.error;
    } catch (e) {
      console.error('Middleware: Exception getting session:', e);
    }

    // Geschützte Routen
    const protectedPaths = ['/vocabulary', '/translate', '/train', '/statistics'];
    const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));
    
    if (isProtectedPath) {
      if (!session) {
        // Prüfe alle Cookies - wenn irgendwelche Auth-Cookies existieren, lass IMMER durch
        // Die Client-Side wird die Session prüfen
        const allCookies = req.cookies.getAll();
        const hasAnyAuthCookies = allCookies.some(cookie => {
          const name = cookie.name.toLowerCase();
          return name.includes('supabase') || 
                 name.includes('sb-') ||
                 name.includes('auth') ||
                 name.includes('session');
        });
        
        // Wenn Auth-Cookies existieren, lass durch - Client-Side prüft
        if (hasAnyAuthCookies) {
          return res;
        }
        
        // Prüfe auch LocalStorage im Request (nicht möglich, aber prüfe Referer)
        // Wenn von /login kommend, lass durch
        const referer = req.headers.get('referer');
        if (referer && referer.includes('/login')) {
          return res;
        }
        
        // Nur wenn wirklich keine Auth-Cookies UND nicht von Login kommend, redirecten
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('returnTo', req.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Auth-Routen umleiten wenn bereits eingeloggt
    if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') && session) {
      // Entferne returnTo Parameter wenn vorhanden
      const vocabUrl = new URL('/vocabulary', req.url);
      return NextResponse.redirect(vocabUrl);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Bei Fehler einfach weiterleiten - die Client-Side wird es prüfen
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

