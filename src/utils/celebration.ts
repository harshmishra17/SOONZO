import confetti from 'canvas-confetti';

/**
 * Fires a lightweight, subtle celebration burst when a task or checklist item is completed.
 * Respects prefers-reduced-motion.
 */
export function fireTaskCompletionCelebration(): void {
  if (typeof window === 'undefined') return;

  // Respect system reduced motion preferences
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) {
    return;
  }

  try {
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#A78BFA', '#38BDF8', '#34D399', '#FBBF24', '#F472B6'],
      ticks: 180,
      gravity: 1.1,
      scalar: 0.85,
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Celebration confetti could not fire:', err);
  }
}
