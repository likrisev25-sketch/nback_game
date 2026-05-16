'use client';

import React from 'react';

interface MatchButtonProps {
  onClick: () => void;
  disabled: boolean;
  isPressed?: boolean; // Для визуальной обратной связи
  label?: string;
}

/**
 * Кнопка "Совпадение" для игры N-back
 * 
 * Игрок нажимает эту кнопку, когда считает, что текущая позиция
 * совпадает с позицией N шагов назад.
 * 
 * @param onClick - Обработчик нажатия
 * @param disabled - Блокировка кнопки
 * @param isPressed - Визуальное состояние нажатия
 * @param label - Текст на кнопке
 */
export const MatchButton: React.FC<MatchButtonProps> = ({
  onClick,
  disabled,
  isPressed = false,
  label = 'СОВПАДЕНИЕ!',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full max-w-xs py-6 px-8 rounded-2xl
        text-xl sm:text-2xl font-bold uppercase tracking-wider
        transition-all duration-150 transform
        ${disabled
          ? 'bg-gray-400 cursor-not-allowed opacity-50'
          : isPressed
            ? 'bg-green-600 scale-95 shadow-inner'
            : 'bg-gradient-to-b from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 active:scale-95 shadow-lg hover:shadow-xl'
        }
        text-white
        border-4 border-green-700
      `}
    >
      <span className="drop-shadow-md">{label}</span>
      {!disabled && (
        <div className="text-xs mt-1 opacity-80">
          Нажми, если позиция совпадает
        </div>
      )}
    </button>
  );
};

export default MatchButton;
