import { NextRequest, NextResponse } from 'next/server';
import { translateWithGemini } from '@/lib/gemini';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 Tage

interface CachedTranslation {
  id: string;
  source_text: string;
  source_language: string;
  target_language: string;
  translated_text: string;
  created_at: string;
}

async function checkCache(
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<CachedTranslation | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('translation_cache')
      .select('*')
      .eq('source_text', sourceText.toLowerCase().trim())
      .eq('source_language', sourceLanguage)
      .eq('target_language', targetLanguage)
      .single();
    
    if (error || !data) return null;
    
    // Prüfe ob Cache noch gültig
    const cacheDate = new Date(data.created_at);
    const now = new Date();
    if (now.getTime() - cacheDate.getTime() > CACHE_DURATION) {
      await supabase
        .from('translation_cache')
        .delete()
        .eq('id', data.id);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Cache check error:', error);
    return null;
  }
}

async function saveToCache(
  sourceText: string,
  sourceLanguage: string,
  targetLanguage: string,
  translatedData: any
): Promise<void> {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.from('translation_cache').insert({
      source_text: sourceText.toLowerCase().trim(),
      source_language: sourceLanguage,
      target_language: targetLanguage,
      translated_text: JSON.stringify(translatedData), // Speichere als JSON
    });
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLanguage } = body;
    
    if (!text || !sourceLanguage) {
      return NextResponse.json(
        { error: 'Fehlende Parameter' },
        { status: 400 }
      );
    }

    const targetLanguage = sourceLanguage === 'de' ? 'ja' : 'de';
    
    // Prüfe Cache zuerst
    const cached = await checkCache(text, sourceLanguage, targetLanguage);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached.translated_text);
        return NextResponse.json({
          ...cachedData,
          fromCache: true,
        });
      } catch (e) {
        // Falls altes Format, ignoriere Cache
      }
    }
    
    // Gemini API Call
    const translationResult = await translateWithGemini(text, sourceLanguage);
    
    // Speichere im Cache
    await saveToCache(text, sourceLanguage, targetLanguage, translationResult);
    
    return NextResponse.json({
      ...translationResult,
      fromCache: false,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Übersetzung fehlgeschlagen', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
