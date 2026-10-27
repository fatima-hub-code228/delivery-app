/**
 * Procedural luxury acoustic alert chime using Web Audio API.
 * Produces an authentic, warm restaurant order notification tone.
 */
let audioCtx: AudioContext | null = null;

export function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }

    const now = audioCtx.currentTime;
    
    // Luxury two-tone chime (F#5 and C#6)
    const notes = [
      { freq: 739.99, start: 0, duration: 0.8 },
      { freq: 1108.73, start: 0.15, duration: 1.1 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      // Warm attack and gentle bell-like decay
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch {
    // Graceful fallback if audio is not permitted yet
  }
}
