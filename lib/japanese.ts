/**
 * Japanese text utilities for converting between Kanji, Hiragana, and Katakana
 */

/**
 * Prüft ob ein Text hauptsächlich Kanji enthält
 */
export function hasKanji(text: string): boolean {
  // Kanji Unicode Range: U+4E00–U+9FAF
  return /[\u4E00-\u9FAF]/.test(text);
}

/**
 * Prüft ob ein Text Hiragana enthält
 */
export function hasHiragana(text: string): boolean {
  // Hiragana Unicode Range: U+3040–U+309F
  return /[\u3040-\u309F]/.test(text);
}

/**
 * Prüft ob ein Text Katakana enthält
 */
export function hasKatakana(text: string): boolean {
  // Katakana Unicode Range: U+30A0–U+30FF
  return /[\u30A0-\u30FF]/.test(text);
}

/**
 * Konvertiert Katakana zu Hiragana
 */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[\u30A1-\u30F6]/g, (match) => {
    const charCode = match.charCodeAt(0);
    return String.fromCharCode(charCode - 0x60);
  });
}

/**
 * Konvertiert Hiragana zu Katakana
 */
export function hiraganaToKatakana(text: string): string {
  return text.replace(/[\u3041-\u3096]/g, (match) => {
    const charCode = match.charCodeAt(0);
    return String.fromCharCode(charCode + 0x60);
  });
}

/**
 * Extrahiert nur Hiragana aus einem Text
 */
export function extractHiragana(text: string): string {
  return text.replace(/[^\u3040-\u309F]/g, '');
}

/**
 * Extrahiert nur Katakana aus einem Text
 */
export function extractKatakana(text: string): string {
  return text.replace(/[^\u30A0-\u30FF]/g, '');
}

/**
 * Extrahiert nur Kanji aus einem Text
 */
export function extractKanji(text: string): string {
  return text.replace(/[^\u4E00-\u9FAF]/g, '');
}

/**
 * Formatiert japanischen Text mit alternativen Darstellungen
 */
export interface JapaneseTextDisplay {
  original: string;
  hiragana?: string;
  katakana?: string;
  hasKanji: boolean;
  hasHiragana: boolean;
  hasKatakana: boolean;
}

export function analyzeJapaneseText(text: string): JapaneseTextDisplay {
  return {
    original: text,
    hiragana: hasHiragana(text) ? extractHiragana(text) : undefined,
    katakana: hasKatakana(text) ? extractKatakana(text) : undefined,
    hasKanji: hasKanji(text),
    hasHiragana: hasHiragana(text),
    hasKatakana: hasKatakana(text),
  };
}

/**
 * Versucht Hiragana-Lesung für Kanji zu bekommen über Google Translate
 * Falls nicht verfügbar, wird der Originaltext zurückgegeben
 */
export async function getHiraganaReading(
  text: string,
  translateApi: (text: string, source: string, target: string) => Promise<string>
): Promise<string> {
  if (!hasKanji(text)) {
    return text;
  }

  try {
    // Versuche die Hiragana-Lesung zu bekommen
    // Google Translate kann manchmal Furigana (Hiragana über Kanji) liefern
    // Für jetzt geben wir den Originaltext zurück, da eine echte Konvertierung
    // eine spezielle API benötigt (z.B. jisho.org API oder ähnliches)
    return text;
  } catch (error) {
    console.error('Error getting Hiragana reading:', error);
    return text;
  }
}

