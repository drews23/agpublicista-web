/* Real-signal pulse shared by the Sound Lab and Audio Studio. */
(() => {
  "use strict";

  function analyze(input, rate, { reference, rangeDb = 44 } = {}) {
    const channels = Array.isArray(input) ? input : [input];
    const length = channels[0].length;
    const frameSize = Math.max(1, Math.round(rate * .012), Math.ceil(length / 48000));
    const step = frameSize / rate;
    const count = Math.max(1, Math.ceil(length / frameSize));
    const energy = new Float32Array(count);
    const lows = new Float32Array(count);
    const shape = new Float32Array(count);
    const rises = new Float32Array(count);
    const bassState = new Float64Array(channels.length);
    const cutoff = 1 - Math.exp(-2 * Math.PI * 180 / rate);
    const attack = 1 - Math.exp(-step / .00566);
    const release = 1 - Math.exp(-step / .046);
    let smooth = 0;
    let peak = .00001;
    let rawPeak = .00001;

    for (let frame = 0; frame < count; frame++) {
      const start = frame * frameSize;
      const end = Math.min(length, start + frameSize);
      let power = 0;
      let bassPower = 0;
      for (let channel = 0; channel < channels.length; channel++) {
        const samples = channels[channel];
        let bass = bassState[channel];
        for (let i = start; i < end; i++) {
          const value = Number.isFinite(samples[i]) ? samples[i] : 0;
          bass += cutoff * (value - bass);
          power += value * value;
          bassPower += bass * bass;
        }
        bassState[channel] = bass;
      }
      // Estimate each channel's energy before averaging, so stereo phase cannot erase a beat.
      const n = Math.max(1, (end - start) * channels.length);
      const rms = Math.sqrt(power / n);
      const low = Math.sqrt(bassPower / n);
      const level = Math.max(rms, .75 * rms + .55 * low);
      energy[frame] = level;
      lows[frame] = low;
      smooth += (level - smooth) * (level > smooth ? attack : release);
      shape[frame] = smooth;
      peak = Math.max(peak, smooth);
      rawPeak = Math.max(rawPeak, level);
    }

    const scale = reference ?? peak;
    const lookback = Math.max(1, Math.round(.036 / step));
    const noiseFloor = rawPeak * .018;
    for (let i = 0; i < count; i++) {
      const db = 20 * Math.log10(Math.max(1e-8, shape[i]) / scale);
      shape[i] = Math.min(1, Math.max(0, (db + rangeDb) / rangeDb)) ** 1.45;
      if (energy[i] < rawPeak * .085) continue;
      const before = i - lookback;
      const rise = 20 * Math.log10(energy[i] / Math.max(noiseFloor, energy[before] || 0));
      const lowRise = 20 * Math.log10(Math.max(noiseFloor, lows[i]) / Math.max(noiseFloor, lows[before] || 0));
      rises[i] = Math.max(0, rise, lowRise * .85);
    }
    const hits = [];
    for (let i = 0; i < count; i++) {
      if (rises[i] < 7 || rises[i] <= (rises[i - 1] || 0) || rises[i] < (rises[i + 1] || 0)) continue;
      const at = Math.min(length / rate, (i + .5) * step);
      if (at - (hits.at(-1) ?? -Infinity) >= .11) hits.push(at);
    }
    return { shape, hits: Float32Array.from(hits), step };
  }

  function paint(context, pulse, { width, height, windowStart, windowSpan, start, end, playing, pixelRatio = 1 }) {
    if (!pulse || end <= start) return;
    const { shape, hits, step } = pulse;
    const bottom = height * .9;
    const amplitude = height * .8;
    const span = end - start;
    const points = Math.max(2, Math.min(180, Math.ceil(span / step)));
    const xAt = (seconds) => width * (seconds - windowStart) / windowSpan;
    const yAt = (seconds) => bottom - amplitude * (shape[Math.min(shape.length - 1, Math.floor(seconds / step))] || 0);
    const firstX = xAt(start);
    const lastX = xAt(end);
    let previousX = firstX;
    let previousY = yAt(start);

    context.save();
    context.beginPath();
    context.moveTo(previousX, previousY);
    for (let i = 1; i < points; i++) {
      const at = start + span * i / (points - 1);
      const x = xAt(at);
      const y = yAt(at);
      context.quadraticCurveTo(previousX, previousY, (previousX + x) / 2, (previousY + y) / 2);
      previousX = x;
      previousY = y;
    }
    context.lineTo(lastX, previousY);
    const stroke = context.createLinearGradient(0, height * .08, 0, bottom);
    stroke.addColorStop(0, "#bbfffb");
    stroke.addColorStop(.57, "#55f0ea");
    stroke.addColorStop(1, "rgba(85, 203, 226, .24)");
    context.strokeStyle = stroke;
    context.lineWidth = pixelRatio * 1.7;
    context.shadowColor = "#41deda";
    context.shadowBlur = pixelRatio * 5;
    context.stroke();
    context.shadowBlur = 0;
    context.lineTo(lastX, bottom);
    context.lineTo(firstX, bottom);
    context.closePath();
    const fill = context.createLinearGradient(0, height * .1, 0, bottom);
    fill.addColorStop(0, "rgba(85, 238, 224, .49)");
    fill.addColorStop(.7, "rgba(58, 178, 208, .25)");
    fill.addColorStop(1, "rgba(61, 133, 199, .05)");
    context.fillStyle = fill;
    context.fill();

    // Find the first visible hit without scanning the whole recording on each repaint.
    let lo = 0;
    let hi = hits.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (hits[mid] < start) lo = mid + 1;
      else hi = mid;
    }
    for (let i = lo; i < hits.length && hits[i] <= end; i++) {
      const hit = hits[i];
      const x = xAt(hit);
      const y = yAt(hit);
      const accent = playing ? Math.max(0, 1 - (end - hit) / .19) : 0;
      context.strokeStyle = `rgba(192, 168, 255, ${.3 + accent * .5})`;
      context.lineWidth = pixelRatio;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x, bottom);
      context.stroke();
      context.fillStyle = accent > .2 ? "#e8fffa" : "#bfa5ff";
      context.beginPath();
      context.arc(x, y, pixelRatio * (1.9 + accent * 1.7), 0, Math.PI * 2);
      context.fill();
    }
    context.restore();
  }

  globalThis.LienzoAudioPulse = Object.freeze({ analyze, paint });
})();
