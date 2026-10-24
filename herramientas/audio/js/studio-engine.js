/* Lienzo Audio Studio — local, non-destructive audio processing.
   Dedicated workers keep PCM analysis, DSP and WAV encoding off the UI thread.
   Existing window.LienzoAudio APIs remain untouched. */
(() => {
  "use strict";

  const MiB = 1024 * 1024;
  const limits = Object.freeze({ maxPcmBytes: 384 * MiB, maxWorkingBytes: 768 * MiB, maxChannels: 8, waveformBlocks: 2048 });
  const currentScript = document.currentScript;
  const workerResource = new URL("studio-worker.js", currentScript?.src || new URL("/herramientas/audio/js/studio-engine.js", location.href));
  if (currentScript?.dataset?.workerVersion) workerResource.searchParams.set("v", currentScript.dataset.workerVersion);
  const workerUrl = workerResource.href;
  let outputContext = null;

  function abortError() { return new DOMException("Audio operation canceled.", "AbortError"); }
  function checkAbort(signal) { if (signal?.aborted) throw abortError(); }
  function fail(message, name = "RangeError") { const error = new Error(message); error.name = name; throw error; }
  function progress(callback, value) { if (typeof callback === "function") { try { callback(Math.max(0, Math.min(1, value))); } catch (_) {} } }
  function tick() { return new Promise((resolve) => setTimeout(resolve, 0)); }

  function inspect(buffer) {
    if (!buffer || typeof buffer.getChannelData !== "function" || !Number.isSafeInteger(buffer.length) || buffer.length < 1 || !Number.isInteger(buffer.numberOfChannels) || buffer.numberOfChannels < 1 || buffer.numberOfChannels > limits.maxChannels || !Number.isFinite(buffer.sampleRate) || buffer.sampleRate < 8000 || buffer.sampleRate > 192000) {
      fail("Invalid or unsupported audio buffer.", "TypeError");
    }
    const bytes = buffer.length * buffer.numberOfChannels * 4;
    if (!Number.isSafeInteger(bytes) || bytes > limits.maxPcmBytes) fail("Decoded audio exceeds the 384 MiB PCM limit.", "MemoryLimitError");
    return { length: buffer.length, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels, bytes };
  }

  function number(value, fallback, min, max, label) {
    const result = value === undefined || value === null ? fallback : Number(value);
    if (!Number.isFinite(result) || result < min || result > max) fail("Invalid " + label + ".");
    return result;
  }

  function settingsFor(meta, supplied = {}) {
    const duration = meta.length / meta.sampleRate;
    const start = number(supplied.start, 0, 0, duration, "selection start");
    const end = number(supplied.end, duration, 0, duration, "selection end");
    const startFrame = Math.min(meta.length - 1, Math.round(start * meta.sampleRate));
    const endFrame = Math.min(meta.length, Math.round(end * meta.sampleRate));
    if (end <= start || endFrame <= startFrame) fail("The selection must contain at least one audio sample.");
    const rate = number(supplied.rate, 1, 0.25, 4, "playback rate");
    const sampleRate = supplied.sampleRate === "source" || supplied.sampleRate === undefined ? meta.sampleRate : number(supplied.sampleRate, meta.sampleRate, 8000, 192000, "sample rate");
    if (!Number.isInteger(sampleRate)) fail("Sample rate must be an integer.");
    const outputFrames = Math.max(1, Math.round((endFrame - startFrame) * sampleRate / (meta.sampleRate * rate)));
    const outputChannels = supplied.mono ? 1 : meta.channels;
    const outputBytes = outputFrames * outputChannels * 4;
    const selectionBytes = (endFrame - startFrame) * meta.channels * 4;
    const workingBytes = Math.max(meta.bytes + selectionBytes + outputBytes, meta.bytes + 2 * outputBytes);
    if (!Number.isSafeInteger(outputFrames) || outputBytes > limits.maxPcmBytes || workingBytes > limits.maxWorkingBytes) fail("This render exceeds the local audio memory budget. Use a shorter selection.", "MemoryLimitError");
    return {
      startFrame, endFrame, rate, sampleRate, outputFrames, outputChannels,
      gainDb: number(supplied.gainDb, 0, -96, 48, "gain"),
      targetDb: number(supplied.targetDb, -1, -48, 0, "normalization target"),
      fadeIn: number(supplied.fadeIn, 0, 0, 3600, "fade in"),
      fadeOut: number(supplied.fadeOut, 0, 0, 3600, "fade out"),
      reverse: !!supplied.reverse, mono: !!supplied.mono,
      normalize: !!supplied.normalize, removeDC: !!supplied.removeDC,
    };
  }

  async function copyInput(buffer, meta, signal, onProgress) {
    const copies = [];
    const chunk = 262144;
    let copied = 0;
    for (let c = 0; c < meta.channels; c++) {
      checkAbort(signal);
      const source = buffer.getChannelData(c);
      const sourceOffset = meta.offset || 0;
      if (source.length < sourceOffset + meta.length) fail("Invalid audio channel length.", "TypeError");
      const copy = new Float32Array(meta.length);
      for (let at = 0; at < meta.length; at += chunk) {
        checkAbort(signal);
        const end = Math.min(meta.length, at + chunk);
        copy.set(source.subarray(sourceOffset + at, sourceOffset + end), at);
        copied += end - at;
        progress(onProgress, copied / (meta.length * meta.channels));
        if (end < meta.length) await tick();
      }
      copies.push(copy.buffer);
    }
    checkAbort(signal);
    return copies;
  }

  function workerJob(operation, payload, transfer, { signal, onProgress } = {}) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) { reject(abortError()); return; }
      let worker;
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener("abort", cancel);
        worker?.terminate();
        error ? reject(error) : resolve(value);
      };
      const cancel = () => finish(abortError());
      try {
        worker = new Worker(workerUrl, { name: "Lienzo Audio Studio" });
        signal?.addEventListener("abort", cancel, { once: true });
        worker.onmessage = ({ data }) => {
          if (data.type === "progress") progress(onProgress, data.value);
          else if (data.type === "result") finish(null, data.result);
          else if (data.type === "error") {
            const error = new Error(data.message || "Audio processing failed.");
            error.name = data.name || "Error";
            finish(error);
          }
        };
        worker.onerror = (event) => { event.preventDefault?.(); finish(new Error(event.message || "The local audio worker could not start.")); };
        worker.onmessageerror = () => finish(new Error("Could not read the local audio worker result."));
        checkAbort(signal);
        worker.postMessage({ operation, ...payload }, transfer);
      } catch (error) { finish(error); }
    });
  }

  async function prepare(buffer, options = {}) {
    checkAbort(options.signal);
    const meta = inspect(buffer);
    const channels = await copyInput(buffer, meta, options.signal, (value) => progress(options.onProgress, value * 0.08));
    return { meta, channels };
  }

  async function analyze(buffer, options = {}) {
    const { meta, channels } = await prepare(buffer, options);
    const result = await workerJob("analyze", { channels, sampleRate: meta.sampleRate, blocks: limits.waveformBlocks }, channels, { signal: options.signal, onProgress: (value) => progress(options.onProgress, 0.08 + value * 0.92) });
    checkAbort(options.signal);
    result.peaks = result.peaks.map((channel) => ({ min: new Float32Array(channel.min), max: new Float32Array(channel.max) }));
    progress(options.onProgress, 1);
    return result;
  }

  function makeBuffer(channels, length, sampleRate) {
    let result;
    if (typeof AudioBuffer === "function") result = new AudioBuffer({ numberOfChannels: channels.length, length, sampleRate });
    else {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) fail("This browser does not support Web Audio.", "NotSupportedError");
      outputContext ||= new Context();
      result = outputContext.createBuffer(channels.length, length, sampleRate);
    }
    for (let c = 0; c < channels.length; c++) result.copyToChannel(new Float32Array(channels[c]), c);
    return result;
  }

  async function render(buffer, settings = {}, options = {}) {
    checkAbort(options.signal);
    const meta = inspect(buffer);
    const normalized = settingsFor(meta, settings);
    // Only the selected source samples cross the worker boundary.
    const selectionMeta = { ...meta, offset: normalized.startFrame, length: normalized.endFrame - normalized.startFrame };
    const channels = await copyInput(buffer, selectionMeta, options.signal, (value) => progress(options.onProgress, value * 0.08));
    const workerSettings = { ...normalized, startFrame: 0, endFrame: selectionMeta.length };
    const result = await workerJob("render", { channels, sampleRate: meta.sampleRate, settings: workerSettings }, channels, { signal: options.signal, onProgress: (value) => progress(options.onProgress, 0.08 + value * 0.88) });
    checkAbort(options.signal);
    const output = makeBuffer(result.channels, result.length, result.sampleRate);
    checkAbort(options.signal);
    progress(options.onProgress, 1);
    return output;
  }

  async function encodeWav(buffer, options = {}) {
    checkAbort(options.signal);
    const meta = inspect(buffer);
    const bitDepth = options.bitDepth === undefined ? 16 : options.bitDepth;
    if (bitDepth !== 16 && bitDepth !== 24) fail("WAV export supports 16 or 24 bits.");
    const dataBytes = meta.length * meta.channels * (bitDepth / 8);
    const wavBytes = 44 + dataBytes + (dataBytes % 2);
    if (!Number.isSafeInteger(wavBytes) || wavBytes - 8 > 0xffffffff) fail("The WAV would exceed the RIFF 4 GiB limit.");
    if (Math.max(meta.bytes * 2 + wavBytes, meta.bytes + wavBytes * 2) > limits.maxWorkingBytes) fail("This WAV exceeds the local audio memory budget. Use a shorter selection.", "MemoryLimitError");
    const { channels } = await prepare(buffer, options);
    const result = await workerJob("wav", { channels, sampleRate: meta.sampleRate, bitDepth }, channels, { signal: options.signal, onProgress: (value) => progress(options.onProgress, 0.08 + value * 0.92) });
    checkAbort(options.signal);
    const blob = new Blob([result.bytes], { type: "audio/wav" });
    progress(options.onProgress, 1);
    return blob;
  }

  window.LienzoAudioStudio = Object.freeze({ analyze, render, encodeWav, limits });
})();
