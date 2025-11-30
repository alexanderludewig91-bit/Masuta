import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  return NextResponse.json({
    supabase: {
      url: supabaseUrl ? '✅ Konfiguriert' : '❌ Fehlt',
      key: supabaseKey ? '✅ Konfiguriert' : '❌ Fehlt',
    },
    gemini: {
      key: geminiKey ? '✅ Konfiguriert' : '❌ Fehlt',
    },
  });
}

