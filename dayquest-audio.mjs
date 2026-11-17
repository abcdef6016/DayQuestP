const settings = {
  rain: [1500, .22], storm: [1050, .35], heavyRain: [2800, .34],
  white: [10000, .15], hardNoise: [3700, .29], brown: [180, .32], cafe: [660, .24]
};
let context;
let volume;
let current = [];

async function audio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!context) context = new Audio();
  await context.resume();
  return context;
}

function notes(ctx, destination, pitches, at, beat, level, instrument = 'triangle') {
  pitches.forEach((pitch, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const time = at + i * beat;
    osc.type = instrument;
    osc.frequency.value = pitch;
    gain.gain.setValueAtTime(.001, time);
    gain.gain.exponentialRampToValueAtTime(level, time + .025);
    gain.gain.exponentialRampToValueAtTime(.001, time + beat * 1.8);
    osc.connect(gain).connect(destination);
    osc.start(time);
    osc.stop(time + beat * 1.8);
  });
}

export async function gameSound(type) {
  if (!window.dayQuestHome?.soundEnabled()) return;
  try {
    const ctx = await audio();
    const pitches = { add: [440, 660], serve: [523, 659, 880], start: [392, 523, 659], finish: [523, 659, 784, 1047] };
    if (pitches[type]) notes(ctx, ctx.destination, pitches[type], ctx.currentTime, .095, .08);
  } catch { /* Audio availability depends on the device and user gesture. */ }
}

function soundscape(ctx, type) {
  const [cutoff, level] = settings[type];
  const rate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, rate * 12, rate);
  const data = buffer.getChannelData(0);
  let slow = 0;
  let fast = 0;
  let drop = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / rate;
    const white = Math.random() * 2 - 1;
    slow = .992 * slow + .008 * white;
    fast = .82 * fast + .18 * white;
    drop = Math.random() < (type === 'heavyRain' ? .006 : .001) ? Math.random() : drop * .996;
    const rain = white * (.22 + drop * .6);
    if (type === 'storm') data[i] = rain + slow * 8 * Math.exp(-Math.pow((t - 6) / 1.2, 2));
    else if (type === 'rain' || type === 'heavyRain') data[i] = rain;
    else if (type === 'brown') data[i] = slow * 4;
    else if (type === 'cafe') {
      const chatter = fast * (.55 + .28 * Math.sin(t * 12) + .17 * Math.sin(t * 17));
      const clink = t % 3.1;
      data[i] = chatter + .12 * Math.sin(t * 8570) * Math.exp(-clink * 18);
    } else data[i] = white;
  }
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.frequency.value = cutoff;
  gain.gain.value = level;
  source.buffer = buffer;
  source.loop = true;
  source.connect(filter).connect(gain).connect(volume);
  source.start();
  return () => source.stop();
}

const picker = document.getElementById('focus-sound');
const loudness = document.getElementById('focus-volume');
const status = document.getElementById('focus-sound-status');
let generation = 0;

picker.addEventListener('change', async () => {
  const request = ++generation;
  current.forEach(stop => stop());
  current = [];
  status.textContent = '';
  const type = picker.value;
  if (!type) return;
  try {
    const ctx = await audio();
    if (request !== generation) return;
    volume = ctx.createGain();
    volume.gain.value = Number(loudness.value) / 100;
    volume.connect(ctx.destination);
    current.push(() => volume.disconnect());
    if (type === 'music') {
      const phrase = () => notes(ctx, volume, [262, 392, 440, 330, 294, 349, 440, 523, 330, 392, 494, 392, 349, 440, 330, 294], ctx.currentTime, .34, .13, 'sine');
      phrase();
      const interval = setInterval(phrase, 5600);
      current.push(() => clearInterval(interval));
    } else current.push(soundscape(ctx, type));
  } catch {
    picker.value = '';
    status.textContent = 'Audio is unavailable on this device.';
  }
});
loudness.addEventListener('input', () => {
  if (volume) volume.gain.value = Number(loudness.value) / 100;
});
