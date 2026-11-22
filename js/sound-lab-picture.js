import { colorizeSpectrum, computePeaks, computeSpectrogram, rmsDb } from './sound-lab-dsp.js?v=4';

const pulseModule = new URL('./audio-pulse.js', self.location.href);
const pulseVersion = new URL(self.location.href).searchParams.get('pulse');
if (pulseVersion) pulseModule.searchParams.set('v', pulseVersion);

self.onmessage = async ({ data }) => {
  const { id, pcm, rate } = data;
  try {
    await import(pulseModule.href);
    const peaks = computePeaks(pcm, Math.min(16384, pcm.length));
    const pulse = self.LienzoAudioPulse.analyze(pcm, rate);
    const { columns, rows, levels } = await computeSpectrogram(pcm, rate);
    const pixels = colorizeSpectrum(levels);
    let peak = 0;
    let attack = 0;
    for (let i = 0; i < pcm.length; i += 1) {
      const value = Math.abs(pcm[i]);
      if (value > peak) { peak = value; attack = i / rate; }
    }
    const result = { id, peaks, pulse, spectrum: { columns, rows, pixels }, rms: rmsDb(pcm), peak, attack };
    self.postMessage(result, [peaks.buffer, pixels.buffer, pulse.shape.buffer, pulse.hits.buffer]);
  } catch {
    self.postMessage({ id, error: true });
  }
};
