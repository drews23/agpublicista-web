(() => {
  "use strict";

  const record = document.querySelector(".record");
  if (!record) return;
  const find = (selector) => record.querySelector(selector);
  const audio = find("[data-record-audio]");
  const queue = find("[data-record-queue]");
  const defaultRows = Array.from(queue.children, (row) => row.cloneNode(true));
  const play = find("[data-record-play]");
  const info = find("[data-record-info]");
  const drawer = find("#record-details");
  const seek = find("[data-record-seek]");
  const art = find("[data-record-art]");
  const title = find("[data-record-title]");
  const artist = find("[data-record-artist]");
  const currentTime = find("[data-record-time]");
  const totalTime = find("[data-record-total]");
  const status = find("[data-record-status]");
  const announcement = find("[data-record-announcement]");
  const reset = find("[data-record-reset]");
  const wash = Array.from(record.querySelectorAll("[data-record-wash]"));
  const urls = new Set();
  const choices = () => Array.from(queue.querySelectorAll("[data-record-choice]"));
  let selected = choices()[0];
  let activeWash = 0;
  let washUrl = selected.dataset.cover;
  let manualDrawer = null;
  let washRequest = 0;
  let coverRequest = 0;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "–:––";
    return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
  }

  function feedback(message = "") {
    status.textContent = message;
    status.hidden = !message;
  }

  function showDrawer() {
    const visible = manualDrawer ?? (!audio.paused && !audio.ended);
    if (!visible && drawer.contains(document.activeElement)) info.focus();
    record.toggleAttribute("data-details-open", visible);
    drawer.inert = !visible;
    info.setAttribute("aria-expanded", String(visible));
    info.setAttribute("aria-label", visible ? record.dataset.hide : record.dataset.show);
  }

  function syncTransport() {
    const playing = !audio.paused && !audio.ended;
    play.setAttribute("aria-label", playing ? record.dataset.pause : record.dataset.play);
    if (!playing) record.removeAttribute("data-playing");
    showDrawer();
  }

  function syncTime() {
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ?
      audio.duration : Number(selected.dataset.duration) || 0;
    const progress = Math.max(0, Math.min(audio.currentTime || 0, duration));
    currentTime.textContent = formatTime(progress);
    totalTime.textContent = formatTime(duration || NaN);
    seek.max = String(duration || 1);
    seek.disabled = !duration;
    seek.value = String(progress);
    seek.style.setProperty("--played", duration ? progress / duration * 100 + "%" : "0%");
    seek.setAttribute("aria-valuetext", currentTime.textContent + " / " + totalTime.textContent);
  }

  function paintCover(button) {
    const { cover, tone } = button.dataset;
    art.src = cover;
    record.style.setProperty("--record-tone", tone);
    const request = ++washRequest;
    if (cover === washUrl) return;
    const next = 1 - activeWash;
    const layer = wash[next];
    layer.src = cover;
    const show = () => {
      if (request !== washRequest) return;
      wash[activeWash].classList.remove("is-visible");
      layer.classList.add("is-visible");
      activeWash = next;
      washUrl = cover;
    };
    if (layer.complete && layer.naturalWidth) show();
    else layer.decode().then(show, () => {});
  }

  function playSelected() {
    const playingChoice = selected;
    feedback();
    audio.play().catch((error) => {
      if (playingChoice === selected && error.name !== "AbortError") {
        feedback(record.dataset.error);
        syncTransport();
      }
    });
  }

  function select(button, continuePlaying = false) {
    if (button === selected) return;
    audio.pause();
    selected?.setAttribute("aria-pressed", "false");
    selected = button;
    button.setAttribute("aria-pressed", "true");
    audio.src = button.dataset.src;
    title.textContent = button.dataset.title;
    artist.textContent = button.dataset.artist;
    announcement.textContent = title.textContent + (artist.textContent ? " · " + artist.textContent : "");
    paintCover(button);
    feedback();
    syncTime();
    syncTransport();
    if (continuePlaying) playSelected();
  }

  function navigate(step) {
    const tracks = choices();
    const index = (tracks.indexOf(selected) + step + tracks.length) % tracks.length;
    select(tracks[index], !audio.paused && !audio.ended);
  }

  play.addEventListener("click", () => {
    if (audio.paused || audio.ended) {
      manualDrawer = null;
      playSelected();
    } else {
      audio.pause();
    }
  });
  find("[data-record-prev]").addEventListener("click", () => navigate(-1));
  find("[data-record-next]").addEventListener("click", () => navigate(1));
  info.addEventListener("click", () => {
    manualDrawer = !record.hasAttribute("data-details-open");
    showDrawer();
  });
  seek.addEventListener("input", () => {
    if (!seek.disabled) {
      audio.currentTime = Number(seek.value);
      syncTime();
    }
  });
  find("[data-record-volume]").addEventListener("input", (event) => {
    audio.volume = Number(event.target.value);
  });
  audio.addEventListener("loadedmetadata", () => {
    selected.querySelector("[data-record-length]").textContent = formatTime(audio.duration);
    syncTime();
  });
  audio.addEventListener("timeupdate", syncTime);
  audio.addEventListener("durationchange", syncTime);
  audio.addEventListener("seeked", syncTime);
  audio.addEventListener("play", syncTransport);
  audio.addEventListener("playing", () => { record.setAttribute("data-playing", ""); });
  audio.addEventListener("waiting", () => { record.removeAttribute("data-playing"); });
  audio.addEventListener("pause", syncTransport);
  audio.addEventListener("ended", () => {
    audio.currentTime = 0;
    syncTransport();
    syncTime();
  });
  audio.addEventListener("error", () => {
    feedback(record.dataset.error);
    syncTransport();
  });

  queue.addEventListener("click", (event) => {
    const button = event.target.closest("[data-record-choice]");
    if (button) select(button, !audio.paused && !audio.ended);
  });
  queue.addEventListener("keydown", (event) => {
    const shift = { ArrowUp: -1, ArrowDown: 1 }[event.key];
    const button = event.target.closest("[data-record-choice]");
    if (!button || !shift) return;
    const tracks = choices();
    event.preventDefault();
    tracks[(tracks.indexOf(button) + shift + tracks.length) % tracks.length].focus();
  });

  find("[data-record-file]").addEventListener("change", (event) => {
    let first;
    for (const file of event.target.files) {
      if (!file.type.startsWith("audio/") && !/\.(mp3|wav|m4a|ogg|opus|flac|aac|webm|aiff?)$/i.test(file.name)) continue;
      const row = defaultRows[choices().length % defaultRows.length].cloneNode(true);
      const button = row.querySelector("[data-record-choice]");
      const source = URL.createObjectURL(file);
      urls.add(source);
      button.dataset.src = source;
      button.dataset.title = file.name.replace(/\.[^.]+$/, "");
      button.dataset.artist = record.dataset.local;
      button.dataset.duration = "0";
      button.querySelector("strong").textContent = button.dataset.title;
      button.querySelector("small").textContent = button.dataset.artist;
      button.querySelector("[data-record-length]").textContent = "–:––";
      button.setAttribute("aria-pressed", "false");
      queue.append(row);
      first ??= button;
    }
    if (first) {
      select(first);
      manualDrawer = true;
      showDrawer();
      reset.hidden = false;
    } else if (event.target.files.length) {
      feedback(record.dataset.fileError);
    }
    event.target.value = "";
  });

  find("[data-record-cover]").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    const button = selected;
    const request = ++coverRequest;
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type) && !/\.(jpe?g|png|webp|avif)$/i.test(file.name)) {
      feedback(record.dataset.coverError);
      return;
    }
    const url = URL.createObjectURL(file);
    const preview = new Image();
    preview.src = url;
    try {
      await preview.decode();
    } catch {
      URL.revokeObjectURL(url);
      if (request === coverRequest) feedback(record.dataset.coverError);
      return;
    }
    if (request !== coverRequest || !button.isConnected) {
      URL.revokeObjectURL(url);
      return;
    }
    const previous = button.dataset.cover;
    urls.add(url);
    button.dataset.cover = url;
    button.querySelector("img").src = url;
    if (button === selected) paintCover(button);
    if (urls.delete(previous)) URL.revokeObjectURL(previous);
    reset.hidden = false;
    feedback();
  });

  function removeLocalFiles() {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls.clear();
  }
  reset.addEventListener("click", () => {
    coverRequest += 1;
    manualDrawer = null;
    queue.replaceChildren(...defaultRows.map((row) => row.cloneNode(true)));
    select(choices()[0]);
    removeLocalFiles();
    reset.hidden = true;
  });
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) removeLocalFiles();
  });

  syncTime();
  syncTransport();
  audio.controls = false;
})();
