'use client';

import { useState } from 'react';
import { Vocabulary } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import JapaneseTextDisplay from '@/components/japanese/JapaneseTextDisplay';

interface FlashCardsProps {
  vocabulary: Vocabulary;
  onAnswer: (correct: boolean) => void;
}

export default function FlashCards({ vocabulary, onAnswer }: FlashCardsProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleFlip = () => {
    if (!answered) {
      setIsFlipped(!isFlipped);
    }
  };

  const handleAnswer = (correct: boolean) => {
    setAnswered(true);
    setTimeout(() => {
      onAnswer(correct);
      setIsFlipped(false);
      setAnswered(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-full max-w-md">
        <motion.div
          className="relative cursor-pointer"
          onClick={handleFlip}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {!isFlipped ? (
              <motion.div
                key="front"
                initial={{ rotateY: 0 }}
                exit={{ rotateY: -90 }}
                className="bg-white rounded-lg shadow-xl p-8 border-2 border-gray-200 min-h-[300px] flex flex-col items-center justify-center"
              >
                <p className="text-sm text-gray-700 mb-4">Klicken zum Umdrehen</p>
                <h2 className="text-4xl font-bold text-center mb-4">
                  {vocabulary.german_text}
                </h2>
                {vocabulary.romaji && (
                  <p className="text-gray-600 italic">{vocabulary.romaji}</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ rotateY: 90 }}
                animate={{ rotateY: 0 }}
                className="bg-blue-50 rounded-lg shadow-xl p-8 border-2 border-blue-200 min-h-[300px] flex flex-col items-center justify-center"
              >
                <p className="text-sm text-blue-600 mb-4">Rückseite</p>
                <div className="text-center mb-4">
                  <JapaneseTextDisplay
                    text={vocabulary.japanese_text}
                    size="xl"
                    showHiragana={true}
                    hiraganaReading={vocabulary.romaji}
                    className="text-blue-900"
                  />
                </div>
                {vocabulary.romaji && (
                  <p className="text-blue-700 italic">{vocabulary.romaji}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {isFlipped && !answered && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => handleAnswer(false)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              ✗ Falsch
            </button>
            <button
              onClick={() => handleAnswer(true)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              ✓ Richtig
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

