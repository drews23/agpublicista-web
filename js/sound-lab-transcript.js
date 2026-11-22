let transcriber;

self.onmessage = async ({ data }) => {
  const { pcm, language } = data;
  try {
    if (!transcriber) {
      const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
      env.allowLocalModels = false;
      env.backends.onnx.wasm.numThreads = 1;
      transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        device: 'wasm', dtype: 'q8',
        progress_callback(info) {
          if (info.status === 'progress') self.postMessage({ progress: info.progress });
        },
      });
    }
    const result = await transcriber(pcm, { language, return_timestamps: true, chunk_length_s: 25, stride_length_s: 4 });
    self.postMessage({ text: result.text, chunks: result.chunks || [] });
  } catch {
    transcriber = null;
    self.postMessage({ error: true });
  }
};
