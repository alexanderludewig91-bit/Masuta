import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      error: 'Environment variables nicht gesetzt',
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!supabaseKey,
    }, { status: 500 });
  }

  try {
    // Teste die Verbindung
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Versuche eine einfache Anfrage
    const { data, error } = await supabase.from('vocabularies').select('count').limit(1);
    
    return NextResponse.json({
      success: true,
      url: supabaseUrl.substring(0, 30) + '...', // Nur ersten Teil zeigen
      connectionTest: error ? 'Fehler' : 'OK',
      error: error?.message,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      url: supabaseUrl.substring(0, 30) + '...',
    }, { status: 500 });
  }
}

