// Файл: Grid3x3.tsx
'use client';

import React, { useState, useCallback } from 'react';

interface Grid3x3Props {
  activePosition: number | null; // Текущая активная позиция (0-8)
  onPositionClick: (position: number) => void;
  disabled: boolean;
  showMatchIndicator?: boolean; // Показывать индикатор совпадения
  matchPosition?: number; // Позиция для индикатора совпадения
}

/**
 * Компонент сетки 3×3 для игры N-back
 * 
 * Сетка отображает последовательность стимулов (позиций).
 * Игрок должен нажимать кнопку "Совпадение", когда текущая позиция
 * совпадает с позицией N шагов назад.
 * 
 * @param activePosition - Текущая активная позиция в сетке (0-8)
 * @param onPositionClick - Обработчик клика по позиции
 * @param disabled - Блокировка взаимодействия
 * @param showMatchIndicator - Показывать ли индикатор совпадения
 * @param matchPosition - Позиция для отображения индикатора совпадения
 */
export const Grid3x3: React.FC<Grid3x3Props> = ({
  activePosition,
  onPositionClick,
  disabled,
  showMatchIndicator = false,
  matchPosition,
}) => {
  // Состояние для анимации появления
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 300);
    return () => clearTimeout(timer);
  }, [activePosition]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Генерация ячеек сетки
  const renderCell = (index: number) => {
    const isActive = activePosition === index;

    return (
      <div
        key={index}
        className={`
          relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28
          rounded-lg border-2 transition-all duration-200
          ${isActive 
            ? 'bg-gray-900 border-transparent scale-105' 
            : 'bg-white border-gray-200'
          }
        `}
      >
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-white/20 dark:bg-black/20 rounded-full animate-ping" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <div
            key={index}
            onClick={() => !disabled && onPositionClick(index)}
            className={`${!disabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          >
            {renderCell(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Grid3x3;
