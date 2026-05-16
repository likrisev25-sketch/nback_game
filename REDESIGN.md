# 🎨 NBACK GAME — UI/UX REDESIGN

## Обзор

Полный редизайн веб-приложения NBACK GAME с фокусом на:
- **Usability** — интуитивно понятный интерфейс
- **Визуальная иерархия** — чёткое разделение контента
- **Современный стиль** — уровень SaaS/game web app
- **Responsive** — адаптивность для всех устройств

---

## 🎯 Design System

### Цветовая палитра

| Тип | Светлая тема | Тёмная тема |
|-----|-------------|-------------|
| **Background Primary** | `#F5F7FB` | `#0F1115` |
| **Background Secondary** | `#FFFFFF` | `#161920` |
| **Background Tertiary** | `#F0F2F7` | `#1C1F29` |
| **Text Primary** | `#1A1F2E` | `#F9FAFB` |
| **Text Secondary** | `#4A5568` | `#9CA3AF` |
| **Primary** | `#6366F1` (Indigo) | `#818CF8` |
| **Secondary** | `#EC4899` (Pink) | `#F472B6` |
| **Accent** | `#8B5CF6` (Violet) | `#A78BFA` |
| **Success** | `#10B981` | `#34D399` |
| **Warning** | `#F59E0B` | `#FBBF24` |
| **Error** | `#EF4444` | `#F87171` |
| **Border** | `#E2E8F0` | `#2D313A` |

### Типографика

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono: 'JetBrains Mono', 'Fira Code', monospace

H1: 2.5rem → 3rem (mobile → desktop)
H2: 2rem → 2.25rem
H3: 1.5rem → 1.75rem
H4: 1.25rem
Body: 1rem / 1.5
```

### Spacing System

```
4px   (space-1)
8px   (space-2)
12px  (space-3)
16px  (space-4)
20px  (space-5)
24px  (space-6)
32px  (space-8)
40px  (space-10)
48px  (space-12)
64px  (space-16)
80px  (space-20)
96px  (space-24)
```

### Border Radius

```
8px   (sm)   — buttons, inputs
12px  (md)   — small cards
16px  (lg)   — cards
20px  (xl)   — large cards
24px  (2xl)  — modals
9999px (full) — badges, avatars
```

### Shadows

```css
--shadow-sm:  0 1px 3px rgba(0,0,0,0.1)
--shadow-md:  0 4px 6px rgba(0,0,0,0.1)
--shadow-lg:  0 10px 15px rgba(0,0,0,0.1)
--shadow-xl:  0 20px 25px rgba(0,0,0,0.1)
--shadow-2xl: 0 25px 50px rgba(0,0,0,0.25)
```

---

## 📐 Layout

### Grid System
- **12-column grid** для больших экранов
- **Max width: 1200px**
- **Container padding:** 24px (mobile) → 32px (desktop)

### Breakpoints
```
Mobile:  < 640px   (1 column)
Tablet:  ≥ 640px   (2 columns)
Desktop: ≥ 1024px  (3-4 columns)
Wide:    ≥ 1200px  (max width)
```

### Section Spacing
```
Mobile:  64px (py-16)
Desktop: 80px (py-20)
```

---

## 🧩 Компоненты

### Кнопки

```tsx
// Primary CTA
<button className="btn btn-primary btn-lg">
  Начать тренировку
</button>

// Secondary
<button className="btn btn-secondary">
  Турниры
</button>

// Ghost
<button className="btn btn-ghost">
  Отмена
</button>
```

**Состояния:**
- Hover: `translateY(-1px)` + тень
- Focus: `outline: 2px solid #6366F1`
- Disabled: `opacity: 0.5`

### Инпуты

```tsx
<input className="input" placeholder="Введите имя" />
```

**Состояния:**
- Focus: border + shadow ring
- Error: red border
- Success: green checkmark

### Карточки

```tsx
<div className="card">
  {/* Standard card */}
</div>

<div className="card-elevated">
  {/* Elevated card with shadow-lg */}
</div>
```

### Бейджи

```tsx
<span className="badge badge-primary">N=2</span>
<span className="badge badge-success">Активен</span>
<span className="badge badge-warning">Ожидание</span>
<span className="badge badge-error">Ошибка</span>
```

### Аватар

```tsx
<div className="avatar">A</div>
<div className="avatar avatar-sm">A</div>
<div className="avatar avatar-lg">A</div>
```

---

## 📱 Структура страницы

### 1. Header / Navbar
```
┌────────────────────────────────────────────┐
│ [Logo] NBACK    Преимущества  Играть  ...  │
│                                  [Турниры] │
└────────────────────────────────────────────┘
```
- **Sticky** позиционирование
- **Backdrop blur** эффект
- **Height:** 64px

### 2. Hero Section
```
┌────────────────────────────────────────────┐
│         [Тренировка доступна]              │
│                                            │
│      Развивай память с N-Back             │
│           тренировкой                      │
│                                            │
│    Научно обоснованный метод улучшения...  │
│                                            │
│         [Введите ваше имя] ✓               │
│                                            │
│    [▶ Начать]    [🏆 Турниры]              │
└────────────────────────────────────────────┘
```

### 3. Features Grid
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ 🧠   │ │ 🎯   │ │ 📈   │ │ 🏆   │
│Память│ │Фокус │ │Прогр │ │Дост  │
└──────┘ └──────┘ └──────┘ └──────┘
```

### 4. Game Creation (2 columns)
```
┌─────────────────────┐ ┌─────────────────────┐
│ ⚡ Создать игру     │ │ 🎮 Присоединиться   │
│                     │ │                     │
│ [Название]          │ │ [ID игры]           │
│ [N=2▼] [Игроки:2]   │ │                     │
│ ☑ Добавить бота 80% │ │ [Присоединиться]    │
│                     │ │                     │
│ [Создать игру]      │ │ ──────────────────  │
│                     │ │ Активные игры ↻     │
│ ID: xxxxx [Копия]   │ │ ┌────────────────┐  │
│                     │ │ │ Game 1  N=2    │  │
│                     │ │ │       2/2 [Войти]│ │
│                     │ │ └────────────────┘  │
└─────────────────────┘ └─────────────────────┘
```

### 5. How to Play
```
┌────────────────────────────────────────────┐
│  [1] Запомни позицию в сетке 3×3          │
│  [2] Следи за последовательностью         │
│  [3] Нажми "Совпадение" если...           │
│  [4] Получи очко                          │
│  [5] Избегай ошибок                       │
└────────────────────────────────────────────┘
```

### 6. Footer
```
┌────────────────────────────────────────────┐
│  [N] NBACK GAME    © 2024 Cognitive...    │
└────────────────────────────────────────────┘
```

---

## ✨ Улучшения

### Было → Стало

| Проблема | Решение |
|----------|---------|
| Кислотные цвета | Спокойная профессиональная палитра |
| Наложение элементов | 12-column grid + proper spacing |
| Огромные заголовки | Иерархия 2.5rem → 1rem |
| Кнопки устаревшие | Modern button styles с hover states |
| Формы "разваливаются" | Единая высота input'ов |
| Список игр как debug | Карточки с badges и статусами |
| Нет фокуса на CTA | Primary/Secondary чёткое разделение |
| Footer прилипает | Отдельная секция с border-top |
| Нет loading states | Spinners + empty states |
| Нет иконок | Lucide-style SVG icons |

### Добавлено
- ✅ Современные card components
- ✅ Иконки (inline SVG)
- ✅ Микроанимации (hover, focus, transitions)
- ✅ Light gradients (умеренно)
- ✅ Loading / Empty состояния
- ✅ Красивые input fields
- ✅ Улучшенный lobby/game list UI
- ✅ Красивые badges и статусы
- ✅ Avatar component
- ✅ Responsive typography
- ✅ Proper contrast ratio
- ✅ Focus states для доступности

---

## 🎨 Файлы

| Файл | Описание |
|------|----------|
| `app/globals.css` | Design tokens, компоненты, утилиты |
| `app/page.tsx` | Главная страница (редизайн) |
| `components/layout/Header.tsx` | Навигация |
| `components/game/NBackGame.tsx` | Экран игры |

---

## 📊 Metrics

### Accessibility
- ✅ Contrast ratio ≥ 4.5:1 для текста
- ✅ Focus states для всех интерактивных элементов
- ✅ Semantic HTML
- ✅ ARIA labels где нужно

### Performance
- ✅ Zero external icon dependencies (inline SVG)
- ✅ CSS variables для темизации
- ✅ Minimal animations (respect prefers-reduced-motion)

### Responsive
- ✅ Mobile: 320px+
- ✅ Tablet: 640px+
- ✅ Desktop: 1024px+
- ✅ Wide: 1200px+

---

## 🚀 Следующие шаги

1. **Добавить тёмную тему** (toggle)
2. **Анимации появления** при скролле
3. **Skeleton loaders** для loading states
4. **Toast уведомления** вместо alert
5. **Keyboard shortcuts** для игры
6. **Onboarding tour** для новых пользователей

---

## 📝 Notes

- Не использовать кислотные цвета
- Уменьшить визуальный шум
- Добавлять whitespace щедро
- Контент центрировать по max-width 1200px
- Избегать вложенных grid'ов
- Использовать semantic HTML

---

**Результат:** Профессиональный игровой интерфейс уровня modern SaaS cognitive-training платформы.
