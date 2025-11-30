'use client';

import { useState } from 'react';
import { Vocabulary } from '@/types';
import Button from '@/components/ui/Button';
import JapaneseTextDisplay from '@/components/japanese/JapaneseTextDisplay';

interface MultipleChoiceProps {
  vocabulary: Vocabulary;
  options: string[];
  onAnswer: (correct: boolean) => void;
}

export default function MultipleChoice({
  vocabulary,
  options,
  onAnswer,
}: MultipleChoiceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    const correct = selectedOption === vocabulary.japanese_text;
    setAnswered(true);
    
    setTimeout(() => {
      onAnswer(correct);
      setSelectedOption(null);
      setAnswered(false);
    }, 1500);
  };

  const isCorrect = selectedOption === vocabulary.japanese_text;
  const showFeedback = answered && selectedOption;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">{vocabulary.german_text}</h2>
        {vocabulary.romaji && (
          <p className="text-gray-600 italic">{vocabulary.romaji}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {options.map((option, index) => {
          const isSelected = selectedOption === option;
          const isCorrectOption = option === vocabulary.japanese_text;
          let buttonClass = '';

          if (showFeedback) {
            if (isCorrectOption) {
              buttonClass = 'bg-green-500 text-white border-green-600';
            } else if (isSelected && !isCorrectOption) {
              buttonClass = 'bg-red-500 text-white border-red-600';
            } else {
              buttonClass = 'bg-gray-200 text-gray-800 border-gray-300';
            }
          } else if (isSelected) {
            buttonClass = 'bg-blue-500 text-white border-blue-600';
          } else {
            buttonClass = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
          }

          return (
            <button
              key={index}
              onClick={() => handleSelect(option)}
              disabled={answered}
              className={`p-4 rounded-lg border-2 text-lg font-medium transition-colors ${buttonClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selectedOption && !answered && (
        <Button onClick={handleSubmit} className="w-full" size="lg">
          Antwort bestätigen
        </Button>
      )}

      {showFeedback && (
        <div className={`text-center p-4 rounded-lg ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <p className="text-lg font-semibold">
            {isCorrect ? '✓ Richtig!' : '✗ Falsch'}
          </p>
          {!isCorrect && (
            <div className="mt-2">
              <p className="mb-1">Die richtige Antwort ist:</p>
              <JapaneseTextDisplay
                text={vocabulary.japanese_text}
                size="lg"
                showHiragana={true}
                hiraganaReading={vocabulary.romaji}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

