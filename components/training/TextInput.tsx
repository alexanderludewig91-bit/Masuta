'use client';

import { useState } from 'react';
import { Vocabulary } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import JapaneseTextDisplay from '@/components/japanese/JapaneseTextDisplay';

interface TextInputProps {
  vocabulary: Vocabulary;
  onAnswer: (correct: boolean) => void;
}

export default function TextInput({ vocabulary, onAnswer }: TextInputProps) {
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(false);

  const normalizeText = (text: string): string => {
    return text.trim().toLowerCase().replace(/\s+/g, '');
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    const normalizedInput = normalizeText(input);
    const normalizedCorrect = normalizeText(vocabulary.japanese_text);
    
    // Toleranz für Varianten (Hiragana/Katakana werden gleich behandelt)
    const correct = normalizedInput === normalizedCorrect;

    setAnswered(true);

    setTimeout(() => {
      onAnswer(correct);
      setInput('');
      setAnswered(false);
    }, 2000);
  };

  const normalizedInput = normalizeText(input);
  const normalizedCorrect = normalizeText(vocabulary.japanese_text);
  const isCorrect = normalizedInput === normalizedCorrect && input.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{vocabulary.german_text}</h2>
        {vocabulary.romaji && (
          <p className="text-gray-600 italic">{vocabulary.romaji}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gib die japanische Übersetzung ein:
        </label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !answered) {
              handleSubmit();
            }
          }}
          placeholder="日本語"
          disabled={answered}
          className="text-lg text-center"
          autoFocus
        />
      </div>

      {!answered && (
        <Button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="w-full"
          size="lg"
        >
          Antwort prüfen
        </Button>
      )}

      {answered && (
        <div className={`text-center p-4 rounded-lg ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="text-lg font-semibold mb-2">
            {isCorrect ? '✓ Richtig!' : '✗ Falsch'}
          </p>
          <JapaneseTextDisplay
            text={vocabulary.japanese_text}
            size="xl"
            showHiragana={true}
            hiraganaReading={vocabulary.romaji}
          />
          {vocabulary.romaji && (
            <p className="text-sm text-gray-700 mt-1">{vocabulary.romaji}</p>
          )}
        </div>
      )}
    </div>
  );
}

