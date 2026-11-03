import React from 'react';

interface EmojiBackgroundProps {
  enabled: boolean;
}

// Scattered student-themed emojis with deterministic layout
const EMOJI_ITEMS = [
  { emoji: '📚', top: '5%', left: '8%', rotate: '12deg', mobile: true },
  { emoji: '✏️', top: '12%', left: '85%', rotate: '-15deg', mobile: true },
  { emoji: '💡', top: '24%', left: '4%', rotate: '8deg', mobile: false },
  { emoji: '🚀', top: '28%', left: '92%', rotate: '20deg', mobile: true },
  { emoji: '🎯', top: '42%', left: '12%', rotate: '-10deg', mobile: true },
  { emoji: '🧠', top: '48%', left: '88%', rotate: '15deg', mobile: false },
  { emoji: '💻', top: '60%', left: '6%', rotate: '-12deg', mobile: true },
  { emoji: '📝', top: '65%', left: '94%', rotate: '6deg', mobile: false },
  { emoji: '⏰', top: '78%', left: '10%', rotate: '-18deg', mobile: true },
  { emoji: '✨', top: '82%', left: '86%', rotate: '14deg', mobile: true },
  { emoji: '🎓', top: '92%', left: '3%', rotate: '-8deg', mobile: false },
  { emoji: '🚀', top: '95%', left: '90%', rotate: '25deg', mobile: true },
  { emoji: '💡', top: '18%', left: '50%', rotate: '-6deg', mobile: false },
  { emoji: '📚', top: '72%', left: '48%', rotate: '10deg', mobile: false },
];

export const EmojiBackground: React.FC<EmojiBackgroundProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
    >
      {EMOJI_ITEMS.map((item, index) => (
        <span
          key={index}
          className={`absolute text-lg sm:text-2xl transition-opacity duration-300 opacity-20 dark:opacity-10 text-slate-400 dark:text-slate-600 ${
            item.mobile ? 'inline-block' : 'hidden md:inline-block'
          }`}
          style={{
            top: item.top,
            left: item.left,
            transform: `rotate(${item.rotate})`,
            filter: 'grayscale(15%)',
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
};
