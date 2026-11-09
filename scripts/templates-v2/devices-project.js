/* Store the HTML and original MP4s as a local, unpackable project. */
(() => {
  'use strict';

  const studio = window.LienzoStudio;
  const perspective = studio?.root.dataset.kind === 'laptop-perspective';
  const media = perspective ? window.LienzoLaptopMedia : window.LienzoDeviceMedia;
  const button = document.querySelector('[data-device-project]');
  const status = document.querySelector('[data-device-project-status]');
  if (!studio || !media || !button || !status) return;
  const dialog = button.closest('[data-export-dialog]');
  const htmlButtons = dialog.querySelectorAll('[data-copy],[data-download]');

  const en = document.documentElement.lang.startsWith('en');
  const say = (es, english) => en ? english : es;
  const devices = perspective ? ['laptop'] : ['laptop', 'phone'];
  const videoKey = name => perspective ? 'video' : name + 'Video';
  const limit = 200 * 1024 * 1024;
  const encoder = new TextEncoder();
  const manifestName = 'project-files.js';
  const crcTable = Uint32Array.from({length: 256}, (_, value) => {
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  });
  let pendingManifest;

  class ProjectError extends Error {}

  function tooLarge() {
    return new ProjectError(say(
      'El proyecto supera los 200 MB. Elige clips MP4 más pequeños y vuelve a intentarlo.',
      'The project is over 200 MB. Choose smaller MP4 clips and try again.'
    ));
  }

  function reselect(name, canSaveHtml = false) {
    const message = name === 'laptop' ? say(
      'Vuelve a seleccionar el MP4 original del portátil para incluirlo en el ZIP.',
      'Choose the original laptop MP4 again to include it in the ZIP.'
    ) : say(
      'Vuelve a seleccionar el MP4 original del móvil para incluirlo en el ZIP.',
      'Choose the original phone MP4 again to include it in the ZIP.'
    );
    const saveHtml = canSaveHtml ? say(
      ' Para conservar los clips y marcadores que ya tienes, también puedes descargar el HTML y guardarlo como index.html en esta misma carpeta.',
      ' To keep your existing clips and markers, you can also download the HTML and save it as index.html in this same folder.'
    ) : '';
    return new ProjectError(message + saveHtml);
  }

  function loadManifest() {
    if (window.LienzoDeviceProjectFiles) return Promise.resolve(window.LienzoDeviceProjectFiles);
    if (pendingManifest) return pendingManifest;
    pendingManifest = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const failed = () => reject(new ProjectError(say(
        'No se pudieron cargar los archivos del proyecto. Comprueba que project-files.js esté junto a index.html y vuelve a intentarlo.',
        'Could not load the project files. Check that project-files.js is beside index.html and try again.'
      )));
      script.src = new URL(manifestName, document.baseURI).href;
      script.onload = () => {
        script.remove();
        if (window.LienzoDeviceProjectFiles) resolve(window.LienzoDeviceProjectFiles);
        else failed();
      };
      script.onerror = () => {
        script.remove();
        failed();
      };
      document.head.append(script);
    }).finally(() => { pendingManifest = null; });
    return pendingManifest;
  }

  function decodeBase64(base64) {
    if (typeof Uint8Array.fromBase64 === 'function') return Uint8Array.fromBase64(base64);
    const binary = atob(base64);
    const result = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) result[i] = binary.charCodeAt(i);
    return result;
  }

  async function demoClip(name) {
    if (!devices.includes(name)) throw new TypeError('Unknown demo device');
    const manifest = await loadManifest();
    const data = manifest['assets/demo-' + name + '.mp4'];
    if (typeof data !== 'string' || !data) throw new Error('Missing demo clip');
    return new Blob([decodeBase64(data)], {type: 'video/mp4'});
  }

  if (!perspective) window.LienzoDeviceProject = Object.freeze({demoClip});

  function pathIsSafe(path) {
    return /^[\w.-]+(?:\/[\w.-]+)*$/.test(path) &&
      path.split('/').every(part => part !== '.' && part !== '..');
  }

  function updateCrc(crc, bytes) {
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return crc;
  }

  async function checksum(data) {
    let crc = 0xffffffff;
    if (data instanceof Blob) {
      const reader = data.stream().getReader();
      try {
        for (;;) {
          const {done, value} = await reader.read();
          if (done) break;
          crc = updateCrc(crc, value);
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      crc = updateCrc(crc, data);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // ZIP STORE: keep the original media bytes, with no encoder or ZIP library.
  async function makeZip(files) {
    const sizeOf = data => data instanceof Blob ? data.size : data.byteLength;
    const contentBytes = files.reduce((bytes, [, data]) => bytes + sizeOf(data), 0);
    if (contentBytes > limit || files.length > 0xffff) throw tooLarge();

    const local = [], central = [];
    let offset = 0, centralBytes = 0;
    for (const [path, data] of files) {
      const name = encoder.encode(path);
      const size = sizeOf(data);
      const crc = await checksum(data);
      const header = new Uint8Array(30);
      const entry = new Uint8Array(46);
      const h = new DataView(header.buffer);
      const e = new DataView(entry.buffer);
      h.setUint32(0, 0x04034b50, true);
      h.setUint16(4, 20, true);
      h.setUint16(6, 0x0800, true);
      h.setUint16(12, 0x21, true);
      h.setUint32(14, crc, true);
      h.setUint32(18, size, true);
      h.setUint32(22, size, true);
      h.setUint16(26, name.length, true);
      e.setUint32(0, 0x02014b50, true);
      e.setUint16(4, 20, true);
      e.setUint16(6, 20, true);
      e.setUint16(8, 0x0800, true);
      e.setUint16(14, 0x21, true);
      e.setUint32(16, crc, true);
      e.setUint32(20, size, true);
      e.setUint32(24, size, true);
      e.setUint16(28, name.length, true);
      e.setUint32(42, offset, true);
      local.push(header, name, data);
      central.push(entry, name);
      offset += header.length + name.length + size;
      centralBytes += entry.length + name.length;
    }
    const end = new Uint8Array(22);
    const tail = new DataView(end.buffer);
    tail.setUint32(0, 0x06054b50, true);
    tail.setUint16(8, files.length, true);
    tail.setUint16(10, files.length, true);
    tail.setUint32(12, centralBytes, true);
    tail.setUint32(16, offset, true);
    return new Blob([...local, ...central, end], {type: 'application/zip'});
  }

  async function readSavedClip(path, name, budget) {
    const response = await fetch(path, {credentials: 'same-origin', redirect: 'error'})
      .catch(() => { throw reselect(name); });
    const mime = response.headers.get('Content-Type')?.split(';', 1)[0];
    if (!response.ok || !response.body || (mime && !['video/mp4', 'application/octet-stream'].includes(mime))) {
      throw reselect(name);
    }
    const declaredSize = Number(response.headers.get('Content-Length'));
    if (declaredSize > budget) throw tooLarge();
    const reader = response.body.getReader();
    const parts = [];
    let size = 0;
    try {
      for (;;) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > budget) {
          await reader.cancel();
          throw tooLarge();
        }
        parts.push(value);
      }
    } catch (error) {
      if (error instanceof ProjectError) throw error;
      throw reselect(name);
    } finally {
      reader.releaseLock();
    }
    if (!size) throw reselect(name);
    return new Blob(parts, {type: 'video/mp4'});
  }

  async function prepareProject(markup, clips) {
    const manifest = await loadManifest();
    const dependencies = Object.entries(manifest);
    // Count the manifest and decoded dependencies before materializing them.
    let budget = limit - markup.length * 3;
    for (const [path, base64] of dependencies) {
      if (!pathIsSafe(path) || path === 'index.html' || path === manifestName ||
          path.startsWith('media/') || typeof base64 !== 'string') {
        throw new Error('Invalid project manifest');
      }
      budget -= base64.length + Math.ceil(base64.length * .75) + path.length + 8;
    }
    if (budget < 0) throw tooLarge();

    const clone = new DOMParser().parseFromString(markup, 'text/html');
    clone.querySelectorAll('[data-export-dialog] [data-device-project], [data-export-dialog] [data-copy], [data-export-dialog] [data-download]')
      .forEach(control => control.removeAttribute('disabled'));
    clone.querySelector('[data-device-project-status]').textContent = '';
    const config = clone.querySelector('[data-config]');
    const payload = JSON.parse(config.textContent);
    const item = payload.state.items[0];
    const files = [];
    for (const {name, file, source} of clips) {
      const target = 'media/' + name + '.mp4';
      let original = file;
      if (!original && source === target) {
        if (location.protocol === 'file:') throw reselect(name, !clips.some(clip => clip.file));
        original = await readSavedClip(target, name, budget);
      }
      if (original) {
        if (original.size > budget) throw tooLarge();
        budget -= original.size;
        files.push([target, original]);
        item[videoKey(name)] = target;
      } else if (source && !Object.hasOwn(manifest, source)) {
        throw reselect(name);
      }
    }
    config.textContent = JSON.stringify(payload).replace(/</g, '\\u003c');
    files.push(['index.html', encoder.encode('<!doctype html>\n' + clone.documentElement.outerHTML)]);
    files.push([manifestName, encoder.encode('window.LienzoDeviceProjectFiles = ' + JSON.stringify(manifest) + ';\n')]);
    for (const [path, base64] of dependencies) files.push([path, decodeBase64(base64)]);
    return makeZip(files);
  }

  function syncHtmlControls() {
    const containsLocalVideo = devices.some(name => Boolean(media.getLocalFile(name)));
    htmlButtons.forEach(control => { control.disabled = containsLocalVideo; });
  }

  addEventListener(perspective ? 'v2:laptop-media' : 'v2:device-media', syncHtmlControls, true);
  document.querySelector('[data-source]')?.addEventListener('click', () => {
    syncHtmlControls();
    if (!button.disabled) status.textContent = '';
  });
  syncHtmlControls();

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = say('Preparando el ZIP…', 'Preparing the ZIP…');
    try {
      // Capture one state before the lazy load or any media reads can yield.
      const markup = studio.source();
      const item = studio.state.items[0];
      const clips = devices.map(name => ({
        name,
        file: media.getLocalFile(name),
        source: item[videoKey(name)]
      }));
      const project = await prepareProject(markup, clips);
      const url = URL.createObjectURL(project);
      const link = document.createElement('a');
      link.href = url;
      link.download = perspective ? 'lienzo-portatil-en-perspectiva.zip' : 'lienzo-mp4-journey.zip';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      status.textContent = say('ZIP preparado. Descomprímelo y abre index.html.', 'ZIP ready. Extract it and open index.html.');
    } catch (error) {
      status.textContent = error instanceof ProjectError ? error.message : say(
        'No se pudo preparar el ZIP. Vuelve a intentarlo.',
        'Could not prepare the ZIP. Please try again.'
      );
    } finally {
      button.disabled = false;
    }
  });
})();
