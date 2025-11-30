import { NextRequest, NextResponse } from 'next/server';

/**
 * Konvertiert Kanji zu Hiragana-Lesung
 * Verwendet jisho.org API (kostenlos, aber rate-limited)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text fehlt' },
        { status: 400 }
      );
    }

    // Versuche Hiragana-Lesung über jisho.org API zu bekommen
    // Format: https://jisho.org/api/v1/search/words?keyword=良い一日
    const jishoUrl = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(text)}`;
    
    try {
      const response = await fetch(jishoUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error('Jisho API error');
      }

      const data = await response.json();
      
      // Debug: Log die API-Antwort
      console.log('Jisho API response for:', text, JSON.stringify(data, null, 2));
      
      // Suche nach der passenden Lesung
      if (data.data && data.data.length > 0) {
        // Durchsuche alle Ergebnisse und finde das beste Match
        // Priorität: 1. Exaktes Match im japanese array, 2. readings array, 3. japanese array
        
        for (const result of data.data) {
          // Prüfe japanese array ZUERST für exakte Matches
          if (result.japanese && Array.isArray(result.japanese)) {
            for (const jp of result.japanese) {
              // Exaktes Match hat höchste Priorität
              if (jp.word === text && jp.reading && /[\u3040-\u309F]/.test(jp.reading)) {
                return NextResponse.json({
                  hiragana: jp.reading,
                  success: true,
                });
              }
            }
          }
        }
        
        // Wenn kein exaktes Match, suche in readings array
        for (const result of data.data) {
          if (result.readings && Array.isArray(result.readings)) {
            for (const reading of result.readings) {
              if (reading.reading && /[\u3040-\u309F]/.test(reading.reading)) {
                // Prüfe ob das Wort im japanese array übereinstimmt
                const hasMatchingWord = result.japanese?.some((jp: any) => jp.word === text);
                if (hasMatchingWord) {
                  return NextResponse.json({
                    hiragana: reading.reading,
                    success: true,
                  });
                }
              }
            }
          }
        }
        
        // Fallback: Nimm die längste Hiragana-Lesung aus readings
        let longestReading: string | null = null;
        let maxLength = 0;
        
        for (const result of data.data) {
          if (result.readings && Array.isArray(result.readings)) {
            for (const reading of result.readings) {
              if (reading.reading && /[\u3040-\u309F]/.test(reading.reading)) {
                if (reading.reading.length > maxLength) {
                  maxLength = reading.reading.length;
                  longestReading = reading.reading;
                }
              }
            }
          }
        }
        
        if (longestReading) {
          return NextResponse.json({
            hiragana: longestReading,
            success: true,
          });
        }
      }
    } catch (error) {
      console.error('Jisho API error:', error);
    }

    // Fallback: Versuche Google Translate zu verwenden
    // Google Translate kann manchmal Furigana liefern, aber nicht direkt
    // Für jetzt geben wir null zurück
    return NextResponse.json({
      hiragana: null,
      success: false,
      message: 'Hiragana-Lesung nicht gefunden',
    });
  } catch (error) {
    console.error('Error getting Hiragana reading:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Hiragana-Lesung' },
      { status: 500 }
    );
  }
}

