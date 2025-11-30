import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Geschützte Routen
  const protectedPaths = ['/vocabulary', '/translate', '/train', '/statistics'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));
  
  // Für geschützte Routen: Lass IMMER durch
  // Die Client-Side (DashboardLayout) wird die Session prüfen und redirecten falls nötig
  // Das ist notwendig für Chrome/Brave, die Cookies anders behandeln
  if (isProtectedPath) {
    return res;
  }
  
  // Für Auth-Routen: Versuche Session zu prüfen, aber nicht kritisch
  if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') {
    try {
      const supabase = createMiddlewareClient({ req, res });
      const { data: { session } } = await supabase.auth.getSession();
      
      // Wenn bereits eingeloggt, redirecten
      if (session) {
        const vocabUrl = new URL('/vocabulary', req.url);
        return NextResponse.redirect(vocabUrl);
      }
    } catch (error) {
      // Ignoriere Fehler - lass Seite laden
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

