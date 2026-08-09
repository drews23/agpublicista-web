/* AG Publicista — Componente de texto sobre onda (TextPathMarquee)
   Uso: <div data-text-path data-text="DISEÑO" data-separator="•" ...></div>
   API global: window.TextPathMarquee, window.initTextPaths, window.getTextPathInstance */
(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const instances = new WeakMap();
  let instanceCounter = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const toNumber = (value, fallback) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const toBoolean = (value, fallback = false) => {
    if (typeof value === "boolean") return value;
    if (value == null) return fallback;
    return String(value).toLowerCase() === "true";
  };

  class TextPathMarquee {
    constructor(element, options = {}) {
      if (!(element instanceof HTMLElement)) {
        throw new TypeError("TextPathMarquee espera un elemento HTML.");
      }

      this.element = element;
      this.id = `text-path-${++instanceCounter}`;
      this.options = this.readOptions(options);
      this.size = { width: 800, height: 200 };
      this.unitWidth = 0;
      this.offset = 0;
      this.lastTime = null;
      this.animationFrame = 0;
      this.resizeObserver = null;
      this.handleWindowResize = null;

      this.build();
      this.measureAndRender(true);
      this.observeResize();
      this.start();
    }

    readOptions(overrides = {}) {
      const data = this.element.dataset;

      return {
        text: overrides.text ?? data.text ?? "TEXT PATH",
        separator: overrides.separator ?? data.separator ?? "•",
        gap: toNumber(overrides.gap ?? data.gap, 2),
        speed: toNumber(overrides.speed ?? data.speed, 30),
        reversed: toBoolean(overrides.reversed ?? data.reversed, true),
        waveFrequency: toNumber(overrides.waveFrequency ?? data.waveFrequency, 3),
        waveHeight: toNumber(overrides.waveHeight ?? data.waveHeight, 100),
        textColor: overrides.textColor ?? data.textColor ?? "#ffffff",
        fontFamily: overrides.fontFamily ?? data.fontFamily ?? "system-ui, sans-serif",
        fontWeight: overrides.fontWeight ?? data.fontWeight ?? "400",
        fontStyle: overrides.fontStyle ?? data.fontStyle ?? "normal",
        fontSize: toNumber(overrides.fontSize ?? data.fontSize, 30),
        letterSpacing: toNumber(overrides.letterSpacing ?? data.letterSpacing, 1),
      };
    }

    build() {
      this.element.textContent = "";

      this.svg = document.createElementNS(SVG_NS, "svg");
      this.svg.setAttribute("xmlns", SVG_NS);
      this.svg.setAttribute("width", "100%");
      this.svg.setAttribute("height", "100%");
      this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      this.svg.setAttribute("aria-hidden", "true");

      const defs = document.createElementNS(SVG_NS, "defs");
      this.path = document.createElementNS(SVG_NS, "path");
      this.path.setAttribute("id", this.id);
      this.path.setAttribute("fill", "none");
      defs.append(this.path);

      this.measureTextTwo = this.createTextElement(true);
      this.measureTextFour = this.createTextElement(true);
      this.visibleText = this.createTextElement(false);
      this.textPath = document.createElementNS(SVG_NS, "textPath");
      this.textPath.setAttribute("href", `#${this.id}`);
      this.visibleText.append(this.textPath);

      this.svg.append(defs, this.measureTextTwo, this.measureTextFour, this.visibleText);
      this.element.append(this.svg);
    }

    createTextElement(hidden) {
      const text = document.createElementNS(SVG_NS, "text");

      if (hidden) {
        text.setAttribute("x", "0");
        text.setAttribute("y", "-9999");
        text.style.visibility = "hidden";
        text.style.pointerEvents = "none";
      }

      return text;
    }

    applyTypography(element) {
      const { fontSize, letterSpacing, fontFamily, fontWeight, fontStyle } = this.options;
      element.style.fontSize = `${fontSize}px`;
      element.style.letterSpacing = `${letterSpacing}px`;
      element.style.fontFamily = fontFamily;
      element.style.fontWeight = fontWeight;
      element.style.fontStyle = fontStyle;
    }

    getUnitText() {
      const safeText = this.options.text.length ? this.options.text : " ";
      const gap = " ".repeat(clamp(Math.round(this.options.gap), 0, 20));
      return `${safeText}${gap}${this.options.separator}${gap}`;
    }

    createWavePath(width, height) {
      const centerY = height / 2;
      const maxAmplitude = Math.max(0, height / 2 - this.options.fontSize);
      const amplitude = clamp(this.options.waveHeight / 2, 0, maxAmplitude);
      const controlAmplitude = amplitude * (4 / 3);
      const halfCyclesVisible = Math.max(1, Math.round(this.options.waveFrequency * 2));
      const halfWidth = width / halfCyclesVisible;
      const overflow = Math.max(100, width * 0.3);
      const leftSteps = Math.ceil(overflow / halfWidth);
      const rightSteps = Math.ceil(overflow / halfWidth);
      const totalSteps = halfCyclesVisible + leftSteps + rightSteps;
      const xStart = -leftSteps * halfWidth;
      const startSign = leftSteps % 2 === 0 ? -1 : 1;

      let pathData = `M ${xStart},${centerY}`;

      for (let index = 0; index < totalSteps; index += 1) {
        const startX = xStart + index * halfWidth;
        const endX = xStart + (index + 1) * halfWidth;
        const peakY = centerY + (index % 2 === 0 ? startSign : -startSign) * controlAmplitude;

        pathData += ` C ${startX + halfWidth / 3},${peakY}`;
        pathData += ` ${endX - halfWidth / 3},${peakY}`;
        pathData += ` ${endX},${centerY}`;
      }

      return { pathData, halfWidth, controlAmplitude, totalSteps };
    }

    measureUnit(unitText) {
      this.measureTextTwo.textContent = unitText.repeat(2);
      this.measureTextFour.textContent = unitText.repeat(4);
      this.applyTypography(this.measureTextTwo);
      this.applyTypography(this.measureTextFour);

      try {
        const lengthTwo = this.measureTextTwo.getComputedTextLength();
        const lengthFour = this.measureTextFour.getComputedTextLength();
        const period = (lengthFour - lengthTwo) / 2;
        return Number.isFinite(period) && period > 0 ? period : 0;
      } catch (error) {
        console.warn("No se pudo medir el texto SVG.", error);
        return 0;
      }
    }

    measureAndRender(force = false) {
      const rect = this.element.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || 800));
      const height = Math.max(1, Math.round(rect.height || 200));

      const sizeUnchanged =
        Math.abs(this.size.width - width) <= 1 &&
        Math.abs(this.size.height - height) <= 1;

      if (!force && sizeUnchanged && this.unitWidth > 0) return;

      this.size = { width, height };
      this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

      const wave = this.createWavePath(width, height);
      this.path.setAttribute("d", wave.pathData);

      const unitText = this.getUnitText();
      const measuredUnitWidth = this.measureUnit(unitText);
      const estimatedUnitWidth = Math.max(1, unitText.length * this.options.fontSize * 0.6);
      this.unitWidth = measuredUnitWidth || estimatedUnitWidth;

      let measuredPathLength = 0;

      try {
        measuredPathLength = this.path.getTotalLength();
      } catch (error) {
        console.warn("No se pudo medir el trazado SVG.", error);
      }

      const segmentArc = 2 * Math.hypot(wave.halfWidth / 2, wave.controlAmplitude) * 1.15;
      const estimatedPathLength = wave.totalSteps * Math.max(wave.halfWidth, segmentArc);
      const effectivePathLength = Math.max(measuredPathLength, estimatedPathLength);
      const repeatCount = clamp(Math.ceil(effectivePathLength / this.unitWidth) + 3, 2, 256);

      this.visibleText.setAttribute("fill", this.options.textColor);
      this.applyTypography(this.visibleText);
      this.textPath.textContent = unitText.repeat(repeatCount);
    }

    observeResize() {
      if (!("ResizeObserver" in window)) {
        this.handleWindowResize = () => this.measureAndRender();
        window.addEventListener("resize", this.handleWindowResize);
        return;
      }

      this.resizeObserver = new ResizeObserver(() => this.measureAndRender());
      this.resizeObserver.observe(this.element);
    }

    start() {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      const animate = (time) => {
        if (this.lastTime == null) this.lastTime = time;

        const delta = Math.min((time - this.lastTime) / 1000, 1 / 30);
        this.lastTime = time;
        const pixelsPerSecond = Math.max(0, this.options.speed) * 5;

        if (this.unitWidth > 0 && pixelsPerSecond > 0) {
          const direction = this.options.reversed ? 1 : -1;
          this.offset += direction * pixelsPerSecond * delta;
          this.offset -= Math.floor(this.offset / this.unitWidth) * this.unitWidth;
          this.textPath.setAttribute("startOffset", `${this.offset}px`);
        }

        this.animationFrame = requestAnimationFrame(animate);
      };

      this.animationFrame = requestAnimationFrame(animate);
    }

    update(nextOptions = {}, syncDataAttributes = true) {
      this.options = { ...this.options, ...nextOptions };

      if (syncDataAttributes) {
        this.writeDataAttributes(nextOptions);
      }

      this.unitWidth = 0;
      this.measureAndRender(true);
    }

    writeDataAttributes(options) {
      const attributeMap = {
        text: "text",
        separator: "separator",
        gap: "gap",
        speed: "speed",
        reversed: "reversed",
        waveFrequency: "waveFrequency",
        waveHeight: "waveHeight",
        textColor: "textColor",
        fontSize: "fontSize",
        letterSpacing: "letterSpacing",
      };

      Object.entries(attributeMap).forEach(([optionName, datasetName]) => {
        if (Object.prototype.hasOwnProperty.call(options, optionName)) {
          this.element.dataset[datasetName] = String(options[optionName]);
        }
      });
    }

    destroy() {
      cancelAnimationFrame(this.animationFrame);
      this.resizeObserver?.disconnect();

      if (this.handleWindowResize) {
        window.removeEventListener("resize", this.handleWindowResize);
      }

      instances.delete(this.element);
      this.element.textContent = "";
    }
  }

  const initTextPaths = (scope = document) => {
    const elements = [];

    if (scope instanceof Element && scope.matches("[data-text-path]")) {
      elements.push(scope);
    }

    elements.push(...scope.querySelectorAll("[data-text-path]"));

    return elements.map((element) => {
      if (!instances.has(element)) {
        instances.set(element, new TextPathMarquee(element));
      }

      return instances.get(element);
    });
  };

  const getTextPathInstance = (element) => instances.get(element) ?? null;

  window.TextPathMarquee = TextPathMarquee;
  window.initTextPaths = initTextPaths;
  window.getTextPathInstance = getTextPathInstance;

  document.addEventListener("DOMContentLoaded", () => {
    initTextPaths();
  });
})();
