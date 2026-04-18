export function playFeedbackSound(type, enabled) {
  if (!enabled) return;

  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = type === "success" ? 640 : 240;
  gainNode.gain.value = 0.05;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
    context.close();
  }, 120);
}
