'use client';

import { useState, useEffect } from 'react';
import { analyzeJapaneseText } from '@/lib/japanese';

interface JapaneseTextDisplayProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showHiragana?: boolean; // Ob Hiragana-Lesung angezeigt werden soll
  hiraganaReading?: string; // Manuell eingegebene Hiragana-Lesung (z.B. aus romaji Feld)
}

export default function JapaneseTextDisplay({
  text,
  className = '',
  size = 'md',
  showHiragana = true,
  hiraganaReading: manualHiragana,
}: JapaneseTextDisplayProps) {
  const [hiraganaReading, setHiraganaReading] = useState<string | null>(manualHiragana || null);
  const [loading, setLoading] = useState(false);
  const analysis = analyzeJapaneseText(text);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  useEffect(() => {
    // Wenn manuelle Hiragana-Lesung vorhanden ist, verwende diese
    if (manualHiragana) {
      setHiraganaReading(manualHiragana);
      return;
    }
    
    // Reset beim Text-Wechsel
    setHiraganaReading(null);
    setLoading(false);
    
    // Lade Hiragana-Lesung nur wenn Kanji vorhanden sind und showHiragana aktiviert ist
    // UND keine manuelle Lesung vorhanden ist
    if (showHiragana && analysis.hasKanji && !manualHiragana) {
      setLoading(true);
      fetch('/api/japanese/reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.hiragana) {
            console.log('Hiragana reading received:', data.hiragana, 'for text:', text);
            setHiraganaReading(data.hiragana);
          } else {
            console.log('No Hiragana reading found for:', text, data);
          }
        })
        .catch(error => {
          console.error('Error fetching Hiragana reading:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [text, showHiragana, analysis.hasKanji, manualHiragana]);

  return (
    <div className={className}>
      <div className={`${sizeClasses[size]} font-medium`}>
        {text}
      </div>
      {showHiragana && analysis.hasKanji && (
        <div className="text-sm text-gray-600 mt-1">
          {loading ? (
            <span className="italic">Lade Lesung...</span>
          ) : hiraganaReading ? (
            <span className="italic">({hiraganaReading})</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

