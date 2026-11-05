// ═══════════════════════════════════════
// HAPTICS — Tactile feedback for mobile devices
// ═══════════════════════════════════════

export const vibrate = (pattern = 10) => {
  if (typeof window !== "undefined" && navigator && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Gracefully ignore if blocked by browser policy
    }
  }
};

export const haptics = {
  light: () => vibrate(10),
  medium: () => vibrate(20),
  heavy: () => vibrate([30, 20, 30]),
  error: () => vibrate([50, 50, 50, 50]),
  success: () => vibrate([20, 30, 40]),
  pulse: () => vibrate([15, 30, 15]),
};
