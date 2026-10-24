/* Lienzo Audio Studio worker. All samples remain on the device.
   Rate/resampling uses a normalized 32-tap Hann-windowed sinc kernel,
   precomputed in 512 fractional phases. Speed changes also change pitch. */
(() => {
  "use strict";
  const MAX_PCM_BYTES = 384 * 1024 * 1024;
  const CHUNK = 16384;
  const safe = (sample) => Number.isFinite(sample) ? sample : 0;
  const floatSample = (value) => Math.max(-3.4028234663852886e38, Math.min(3.4028234663852886e38, safe(value)));
  const db = (value) => value > 0 ? 20 * Math.log10(value) : -Infinity;
  const report = (value) => self.postMessage({ type: "progress", value });

  function input(data) {
    if (!Array.isArray(data.channels) || data.channels.length < 1 || data.channels.length > 8) throw new TypeError("Invalid audio channels.");
    const channels = data.channels.map((buffer) => new Float32Array(buffer));
    const length = channels[0].length;
    if (!length || channels.some((channel) => channel.length !== length) || length * channels.length * 4 > MAX_PCM_BYTES) throw new RangeError("Invalid or excessive audio channel length.");
    if (!Number.isFinite(data.sampleRate) || data.sampleRate < 8000 || data.sampleRate > 192000) throw new RangeError("Invalid audio sample rate.");
    return { channels, length, sampleRate: data.sampleRate };
  }

  function analyze(data) {
    const { channels, length } = input(data);
    const blocks = Math.min(2048, Math.max(1, Math.trunc(data.blocks || 2048)));
    const peaks = [];
    const dcPerChannel = [];
    let peak = 0, squares = 0, sum = 0, clippedSamples = 0, nonFiniteSamples = 0;
    let processed = 0;
    for (let c = 0; c < channels.length; c++) {
      const values = channels[c];
      const min = new Float32Array(blocks);
      const max = new Float32Array(blocks);
      let channelSum = 0;
      // floor on both boundaries partitions every sample, including the tail.
      for (let block = 0; block < blocks; block++) {
        const from = Math.floor(block * length / blocks);
        const end = Math.floor((block + 1) * length / blocks);
        let low = Infinity, high = -Infinity;
        for (let i = from; i < end; i++) {
          const original = values[i];
          const value = safe(original);
          if (!Number.isFinite(original)) nonFiniteSamples++;
          const absolute = Math.abs(value);
          if (absolute > peak) peak = absolute;
          if (absolute >= 1) clippedSamples++;
          if (value < low) low = value;
          if (value > high) high = value;
          squares += value * value;
          channelSum += value;
        }
        min[block] = end > from ? low : 0;
        max[block] = end > from ? high : 0;
        processed += end - from;
        if (block % 32 === 0) report(processed / (length * channels.length));
      }
      sum += channelSum;
      dcPerChannel.push(channelSum / length);
      peaks.push({ min: min.buffer, max: max.buffer });
    }
    const rms = Math.sqrt(squares / (length * channels.length));
    report(1);
    return { peak, rms, dc: sum / (length * channels.length), dcPerChannel, clippedSamples, nonFiniteSamples, peaks, peakDb: db(peak), rmsDb: db(rms) };
  }

  function sincTable(step) {
    const phases = 512, taps = 32, half = taps / 2;
    const cutoff = Math.min(1, 1 / step);
    const table = new Float64Array(phases * taps);
    for (let phase = 0; phase < phases; phase++) {
      const fraction = phase / phases;
      let sum = 0;
      for (let tap = 0; tap < taps; tap++) {
        const x = tap - (half - 1) - fraction;
        const scaled = x * cutoff;
        const sinc = Math.abs(scaled) < 1e-12 ? 1 : Math.sin(Math.PI * scaled) / (Math.PI * scaled);
        const window = Math.abs(x) < half ? 0.5 + 0.5 * Math.cos(Math.PI * x / half) : 0;
        const weight = cutoff * sinc * window;
        table[phase * taps + tap] = weight;
        sum += weight;
      }
      for (let tap = 0; tap < taps; tap++) table[phase * taps + tap] /= sum;
    }
    return table;
  }

  function render(data) {
    const { channels, length, sampleRate } = input(data);
    const settings = data.settings;
    if (!settings || !Number.isSafeInteger(settings.startFrame) || !Number.isSafeInteger(settings.endFrame) || settings.startFrame < 0 || settings.endFrame > length || settings.endFrame <= settings.startFrame || !Number.isSafeInteger(settings.outputFrames) || settings.outputFrames < 1 || settings.outputFrames * settings.outputChannels * 4 > MAX_PCM_BYTES) throw new RangeError("Invalid render settings.");
    const frames = settings.endFrame - settings.startFrame;
    const outLength = settings.outputFrames;
    const output = Array.from({ length: settings.outputChannels }, () => new Float32Array(outLength));
    const offsets = new Float64Array(channels.length);
    if (settings.removeDC) {
      for (let c = 0; c < channels.length; c++) {
        let sum = 0;
        for (let i = settings.startFrame; i < settings.endFrame; i++) {
          sum += safe(channels[c][i]);
          if (i % CHUNK === 0) report(0.08 * (c + (i - settings.startFrame) / frames) / channels.length);
        }
        offsets[c] = sum / frames;
      }
    }
    const sourceStep = sampleRate * settings.rate / settings.sampleRate;
    const direct = Math.abs(sourceStep - 1) < 1e-12;
    const kernel = direct ? null : sincTable(sourceStep);
    const fadeInFrames = Math.min(outLength - 1, Math.round(settings.fadeIn * settings.sampleRate));
    const fadeOutFrames = Math.min(outLength - 1, Math.round(settings.fadeOut * settings.sampleRate));
    const read = (channel, relative) => {
      let at = Math.max(0, Math.min(frames - 1, relative));
      if (settings.reverse) at = frames - 1 - at;
      return safe(channels[channel][settings.startFrame + at]) - offsets[channel];
    };
    let peak = 0;
    for (let outChannel = 0; outChannel < output.length; outChannel++) {
      const values = output[outChannel];
      for (let i = 0; i < outLength; i++) {
        let value = 0;
        const position = i * sourceStep;
        const base = Math.floor(position);
        const phase = Math.min(511, Math.floor((position - base) * 512));
        const firstChannel = settings.mono ? 0 : outChannel;
        const lastChannel = settings.mono ? channels.length : outChannel + 1;
        for (let c = firstChannel; c < lastChannel; c++) {
          if (direct) value += read(c, base);
          else {
            let sample = 0;
            for (let tap = 0; tap < 32; tap++) sample += read(c, base + tap - 15) * kernel[phase * 32 + tap];
            value += sample;
          }
        }
        if (settings.mono) value /= channels.length;
        // Multiplication keeps overlapping fades bounded and endpoints at zero.
        if (fadeInFrames > 0 && i < fadeInFrames) value *= i / fadeInFrames;
        if (fadeOutFrames > 0 && outLength - 1 - i < fadeOutFrames) value *= (outLength - 1 - i) / fadeOutFrames;
        value = safe(value);
        values[i] = floatSample(value);
        peak = Math.max(peak, Math.abs(values[i]));
        if (i % CHUNK === 0) report(0.08 + 0.72 * (outChannel + i / outLength) / output.length);
      }
    }
    const normalization = settings.normalize && peak > 0 ? Math.pow(10, settings.targetDb / 20) / peak : 1;
    const gain = normalization * Math.pow(10, settings.gainDb / 20);
    for (let c = 0; c < output.length; c++) {
      const values = output[c];
      for (let i = 0; i < values.length; i++) {
        values[i] = floatSample(values[i] * gain);
        if (i % CHUNK === 0) report(0.8 + 0.2 * (c + i / outLength) / output.length);
      }
    }
    report(1);
    return { channels: output.map((channel) => channel.buffer), length: outLength, sampleRate: settings.sampleRate };
  }

  function wav(data) {
    const { channels, length, sampleRate } = input(data);
    const bits = data.bitDepth;
    if (bits !== 16 && bits !== 24) throw new RangeError("Unsupported WAV bit depth.");
    const bytesPerSample = bits / 8;
    const blockAlign = channels.length * bytesPerSample;
    const dataBytes = length * blockAlign;
    const pad = dataBytes % 2;
    if (!Number.isSafeInteger(dataBytes) || dataBytes + 36 + pad > 0xffffffff) throw new RangeError("RIFF WAV exceeds the 4 GiB limit.");
    const bytes = new ArrayBuffer(44 + dataBytes + pad);
    const view = new DataView(bytes);
    const text = (at, value) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
    text(0, "RIFF"); view.setUint32(4, 36 + dataBytes + pad, true); text(8, "WAVE");
    text(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, channels.length, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true); view.setUint16(34, bits, true);
    text(36, "data"); view.setUint32(40, dataBytes, true);
    let at = 44;
    for (let i = 0; i < length; i++) {
      for (let c = 0; c < channels.length; c++) {
        const value = Math.max(-1, Math.min(1, safe(channels[c][i])));
        const sample = Math.round(value * (value < 0 ? (bits === 16 ? 32768 : 8388608) : (bits === 16 ? 32767 : 8388607)));
        if (bits === 16) view.setInt16(at, sample, true);
        else { view.setUint8(at, sample & 255); view.setUint8(at + 1, (sample >> 8) & 255); view.setUint8(at + 2, (sample >> 16) & 255); }
        at += bytesPerSample;
      }
      if (i % CHUNK === 0) report(i / length);
    }
    report(1);
    return { bytes };
  }

  self.onmessage = ({ data }) => {
    try {
      let result, transfer;
      if (data.operation === "analyze") { result = analyze(data); transfer = result.peaks.flatMap((channel) => [channel.min, channel.max]); }
      else if (data.operation === "render") { result = render(data); transfer = result.channels; }
      else if (data.operation === "wav") { result = wav(data); transfer = [result.bytes]; }
      else throw new TypeError("Unknown audio operation.");
      self.postMessage({ type: "result", result }, transfer);
    } catch (error) { self.postMessage({ type: "error", message: error.message || "Audio processing failed.", name: error.name || "Error" }); }
  };
})();
