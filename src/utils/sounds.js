/**
 * FocusFlow Sound Utility
 * Web Audio API ile programatik ses üretimi — harici dosya gerekmez.
 */

let audioCtx = null;

/** localStorage'dan ses etkin mi kontrol et */
function isSoundEnabled() {
  const stored = localStorage.getItem('ff_sound_enabled');
  return stored === null ? true : stored === 'true';
}

/** localStorage'dan ses seviyesini oku */
function getVolume(override) {
  if (override !== undefined) return override;
  const stored = localStorage.getItem('ff_sound_volume');
  return stored === null ? 0.4 : parseFloat(stored);
}

function getAudioCtx() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Tarayıcı otomatik oynatmayı kısıtlamışsa devam ettir
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Tek bir sinüs tonu çalar.
 * @param {number} frequency - Hz cinsinden frekans
 * @param {number} duration  - Saniye cinsinden süre
 * @param {number} volume    - 0-1 arası ses seviyesi
 * @param {'sine'|'square'|'sawtooth'|'triangle'} type - Dalga tipi
 */
function playTone(frequency, duration, volume = 0.3, type = 'sine') {
  const ctx = getAudioCtx();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  // Yumuşak attack & release (tıklama sesi önleme)
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * Odaklanma süresi bittiğinde çalınan başarı sesi.
 * Dört artan nota — "ding ding ding ding" hissi.
 */
export function playFocusCompleteSound(volume) {
  if (!isSoundEnabled()) return;
  const v = getVolume(volume);
  playTone(523.25, 0.18, v); // C5
  setTimeout(() => playTone(659.25, 0.18, v), 200); // E5
  setTimeout(() => playTone(783.99, 0.35, v), 400); // G5
  setTimeout(() => playTone(1046.5, 0.5,  v), 600); // C6
}

/**
 * Mola süresi bittiğinde çalınan "dikkat" sesi.
 * İki nota — "ding dong" hissi.
 */
export function playBreakCompleteSound(volume) {
  if (!isSoundEnabled()) return;
  const v = getVolume(volume);
  playTone(880, 0.2, v); // A5
  setTimeout(() => playTone(659.25, 0.4, v), 250); // E5
}

/**
 * Takvim etkinliği bildirimi için hafif çan sesi.
 */
export function playEventReminderSound(volume) {
  if (!isSoundEnabled()) return;
  const v = getVolume(volume);
  playTone(1318.51, 0.15, v); // E6
  setTimeout(() => playTone(1174.66, 0.15, v), 160); // D6
  setTimeout(() => playTone(1318.51, 0.4,  v), 320); // E6
}

/**
 * Timer başlatıldığında kısa "tık" sesi.
 */
export function playTimerStartSound(volume) {
  if (!isSoundEnabled()) return;
  const v = getVolume(volume);
  playTone(880, 0.08, v, 'sine');
}

/**
 * Timer duraklatıldığında kısa "tık" sesi.
 */
export function playTimerPauseSound(volume) {
  if (!isSoundEnabled()) return;
  const v = getVolume(volume);
  playTone(660, 0.08, v, 'sine');
}
