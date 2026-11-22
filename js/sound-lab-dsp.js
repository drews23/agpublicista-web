/*!
 * Audio Lab
 * Copyright (c) 2026 Cliff Pyles
 * Released under the MIT License: https://opensource.org/license/mit
 * Original: https://codepen.io/editor/cliffpyles/pen/01a1ef93-56ed-7609-b540-17d81b41ab7d
 * Based on: audio-lab
 */
// Intended use: signal math over sample arrays — the log-frequency spectrogram, waveform peaks
// and loudness. Inner loops are plain `for` loops on purpose: see README, Guardrails.
const config = { audio: { spectrum: { fftSize: 2048, columnsPerSecond: 120, maxColumns: 2160, rows: 180, minHz: 45, floorDb: -90, rangeDb: 78 } } };
/*
--------------------------------------------------------------------------------
FFT (radix-2, in place)
--------------------------------------------------------------------------------
*/
const fftPlans = new Map();
const planFor = size => {
  const cached = fftPlans.get(size);
  if (cached) return cached;
  const bits = Math.log2(size);
  const reverse = new Uint32Array(size);
  for (let i = 0; i < size; i += 1) {
    let value = i;
    let result = 0;
    for (let b = 0; b < bits; b += 1) {
      result = result << 1 | value & 1;
      value >>= 1;
    }
    reverse[i] = result;
  }
  const cos = new Float32Array(size / 2);
  const sin = new Float32Array(size / 2);
  for (let i = 0; i < size / 2; i += 1) {
    cos[i] = Math.cos(2 * Math.PI * i / size);
    sin[i] = -Math.sin(2 * Math.PI * i / size);
  }
  const plan = {
    reverse,
    cos,
    sin
  };
  fftPlans.set(size, plan);
  return plan;
};
const fft = (re, im) => {
  const size = re.length;
  const {
    reverse,
    cos,
    sin
  } = planFor(size);
  for (let i = 0; i < size; i += 1) {
    const j = reverse[i];
    if (j > i) {
      const r = re[i];
      re[i] = re[j];
      re[j] = r;
      const m = im[i];
      im[i] = im[j];
      im[j] = m;
    }
  }
  for (let span = 2; span <= size; span <<= 1) {
    const half = span >> 1;
    const stride = size / span;
    for (let start = 0; start < size; start += span) {
      for (let k = 0; k < half; k += 1) {
        const wr = cos[k * stride];
        const wi = sin[k * stride];
        const a = start + k;
        const b = a + half;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
};
/*
--------------------------------------------------------------------------------
Spectrogram: magnitude in dB, resampled onto log-spaced rows
--------------------------------------------------------------------------------
*/
const yieldToPage = () => new Promise(resolve => setTimeout(resolve, 0));
export const frequencyToRow = (hz, spectrogram) => {
  const {
    rows,
    minHz,
    maxHz
  } = spectrogram;
  const position = Math.log(hz / minHz) / Math.log(maxHz / minHz);
  return (1 - position) * (rows - 1);
};
export const computeSpectrogram = async (samples, rate) => {
  const {
    fftSize,
    columnsPerSecond,
    maxColumns,
    rows,
    minHz,
    floorDb,
    rangeDb
  } = config.audio.spectrum;
  const columns = Math.min(maxColumns, Math.max(1, Math.ceil(samples.length * columnsPerSecond / rate)));
  const hop = samples.length / columns;
  const maxHz = rate / 2;
  const levels = new Uint8ClampedArray(columns * rows);
  const window = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i += 1) window[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (fftSize - 1));
  const windowSum = window.reduce((sum, value) => sum + value, 0);
  const binHz = rate / fftSize;
  const rowBins = Array.from({
    length: rows
  }, (_, row) => {
    const top = minHz * (maxHz / minHz) ** (1 - row / rows);
    const bottom = minHz * (maxHz / minHz) ** (1 - (row + 1) / rows);
    const center = Math.sqrt(top * bottom) / binHz;
    const low = Math.max(1, Math.ceil(bottom / binHz));
    const high = Math.min(fftSize / 2 - 1, Math.floor(top / binHz));
    const neighbor = Math.min(fftSize / 2 - 2, Math.floor(center));
    return { low, high, neighbor, fraction: Math.min(1, center - neighbor) };
  });
  const re = new Float32Array(fftSize);
  const im = new Float32Array(fftSize);
  const power = new Float32Array(fftSize / 2);
  const batch = 240;
  for (let column = 0; column < columns; column += 1) {
    const center = Math.floor(column * hop + hop / 2);
    const start = center - fftSize / 2;
    for (let i = 0; i < fftSize; i += 1) {
      const index = start + i;
      re[i] = index >= 0 && index < samples.length ? samples[index] * window[i] : 0;
      im[i] = 0;
    }
    fft(re, im);
    for (let bin = 0; bin < fftSize / 2; bin += 1) {
      power[bin] = (re[bin] * re[bin] + im[bin] * im[bin]) / (windowSum * windowSum);
    }
    for (let row = 0; row < rows; row += 1) {
      const { low, high, neighbor, fraction } = rowBins[row];
      let peak = power[neighbor] * (1 - fraction) + power[neighbor + 1] * fraction;
      for (let bin = low; bin <= high; bin += 1) peak = Math.max(peak, power[bin]);
      const db = 10 * Math.log10(peak * 4 + 1e-12);
      levels[row * columns + column] = (db - floorDb) / rangeDb * 255;
    }
    if (column % batch === batch - 1) await yieldToPage();
  }
  return {
    columns,
    rows,
    columnsPerSecond: rate / hop,
    maxHz,
    minHz,
    levels
  };
};

// A monotonic cold scale keeps the low-energy floor visible and reserves white for strong peaks.
const spectralColors = [
  [0, 7, 11, 17], [.21, 12, 23, 37], [.45, 18, 47, 69],
  [.66, 24, 87, 107], [.83, 56, 148, 163], [.94, 124, 215, 211],
  [1, 218, 250, 239]
];
const spectrumLut = new Uint8ClampedArray(256 * 4);
let colorStop = 1;
for (let level = 0; level <= 255; level++) {
  const position = level / 255;
  if (position > spectralColors[colorStop][0]) colorStop++;
  const a = spectralColors[colorStop - 1];
  const b = spectralColors[colorStop];
  const mix = (position - a[0]) / (b[0] - a[0]);
  for (let channel = 0; channel < 3; channel++) {
    spectrumLut[level * 4 + channel] = a[channel + 1] + mix * (b[channel + 1] - a[channel + 1]);
  }
  spectrumLut[level * 4 + 3] = 255;
}

export function colorizeSpectrum(levels) {
  const pixels = new Uint8ClampedArray(levels.length * 4);
  const rgba = new Uint32Array(pixels.buffer);
  const colors = new Uint32Array(spectrumLut.buffer);
  for (let index = 0; index < levels.length; index++) rgba[index] = colors[levels[index]];
  return pixels;
}

/*
--------------------------------------------------------------------------------
Waveform peaks and loudness
--------------------------------------------------------------------------------
*/
export const computePeaks = (samples, columns) => {
  const peaks = new Float32Array(columns * 2);
  const per = samples.length / columns;
  for (let column = 0; column < columns; column += 1) {
    const start = Math.floor(column * per);
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((column + 1) * per)));
    let low = 0;
    let high = 0;
    for (let i = start; i < end; i += 1) {
      const value = samples[i];
      if (value < low) low = value;
      if (value > high) high = value;
    }
    peaks[column * 2] = low;
    peaks[column * 2 + 1] = high;
  }
  return peaks;
};
export const rmsDb = samples => {
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
  return 10 * Math.log10(sum / Math.max(1, samples.length) + 1e-12);
};
export const slice = (samples, rate, start, end) => samples.subarray(Math.max(0, Math.floor(start * rate)), Math.min(samples.length, Math.ceil(end * rate)));
/** Loudness in equal steps across the samples, 0 to 1 (square-rooted RMS against the loudest step). */
export const loudnessShape = (samples, steps) => {
  const per = Math.max(1, Math.floor(samples.length / steps));
  const rms = Array.from({
    length: steps
  }, (_, step) => {
    let sum = 0;
    const start = step * per;
    const end = Math.min(samples.length, start + per);
    for (let i = start; i < end; i += 1) sum += samples[i] * samples[i];
    return Math.sqrt(sum / Math.max(1, end - start));
  });
  const top = Math.max(...rms) || 1;
  return rms.map(value => Math.sqrt(value / top));
};
