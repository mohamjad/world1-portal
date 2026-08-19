"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PlaybackPoint = [number, number];

type AsciiVideoDitherProps = {
  batched?: boolean | "auto";
  binarySize?: boolean;
  binarySizeScale?: number;
  className?: string;
  cols?: number;
  cropXBias?: number;
  cropYBias?: number;
  darkMode?: boolean;
  endTimeBySrc?: readonly number[];
  endHoldMs?: number;
  fitMode?: "cover" | "contain";
  invert?: boolean;
  keepSourceVideoWarm?: boolean;
  maxDevicePixelRatio?: number;
  maxRenderFps?: number;
  mobileCols?: number;
  mobileCropXBias?: number;
  mobileCropXBiasBySrc?: readonly number[];
  mobileCropYBias?: number;
  mobileCropYBiasBySrc?: readonly number[];
  mobileEndTimeBySrc?: readonly number[];
  mobileFitMode?: "cover" | "contain";
  mobileScale?: number;
  mobileSampleScale?: number;
  mobileSampleScaleBySrc?: readonly number[];
  mobileSampleXOffsetRatioBySrc?: readonly number[];
  mobileSampleYOffsetRatioBySrc?: readonly number[];
  mobileStartTimeBySrc?: readonly number[];
  mobileSrc?: string | readonly string[];
  mobileXOffsetBySrc?: readonly string[];
  mobileYOffsetBySrc?: readonly string[];
  onPlaybackCycleComplete?: () => void;
  onPlaybackStall?: () => void;
  pauseWhileScrolling?: boolean;
  playbackStallFallbackMs?: number;
  playbackRateSchedule?: readonly PlaybackPoint[];
  pureColor?: boolean;
  saturation?: number;
  scale?: number;
  sampleScale?: number;
  sampleScaleBySrc?: readonly number[];
  sampleXOffsetRatioBySrc?: readonly number[];
  sampleYOffsetRatioBySrc?: readonly number[];
  src: string | readonly string[];
  startTimeBySrc?: readonly number[];
  threshold?: number;
  viewportPause?: boolean | "desktop";
  xOffsetBySrc?: readonly string[];
  yOffsetBySrc?: readonly string[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isTouchIOS = () =>
  typeof navigator !== "undefined" &&
  (/iP(hone|od|ad)/.test(navigator.platform) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

const shouldBatchByDefault = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;

const shouldUseMobileMedia = () =>
  typeof window !== "undefined" && window.innerWidth < 760;

export function AsciiVideoDither({
  batched = "auto",
  binarySize = false,
  binarySizeScale = 0.85,
  className = "",
  cols = 280,
  cropXBias = 0,
  cropYBias = 0,
  darkMode = true,
  endTimeBySrc,
  endHoldMs = 0,
  fitMode = "cover",
  invert = true,
  keepSourceVideoWarm = false,
  maxDevicePixelRatio = 1,
  maxRenderFps,
  mobileCols,
  mobileCropXBias,
  mobileCropXBiasBySrc,
  mobileCropYBias,
  mobileCropYBiasBySrc,
  mobileEndTimeBySrc,
  mobileFitMode,
  mobileScale,
  mobileSampleScale,
  mobileSampleScaleBySrc,
  mobileSampleXOffsetRatioBySrc,
  mobileSampleYOffsetRatioBySrc,
  mobileStartTimeBySrc,
  mobileSrc,
  mobileXOffsetBySrc,
  mobileYOffsetBySrc,
  onPlaybackCycleComplete,
  onPlaybackStall,
  pauseWhileScrolling = false,
  playbackStallFallbackMs = 2200,
  playbackRateSchedule,
  pureColor = false,
  saturation = 2,
  scale = 1,
  sampleScale = 1,
  sampleScaleBySrc,
  sampleXOffsetRatioBySrc,
  sampleYOffsetRatioBySrc,
  src,
  startTimeBySrc,
  threshold = 0.08,
  viewportPause = true,
  xOffsetBySrc,
  yOffsetBySrc,
}: AsciiVideoDitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const standbyVideoRef = useRef<HTMLVideoElement>(null);
  const [useMobileSources, setUseMobileSources] = useState(() =>
    Boolean(mobileSrc && shouldUseMobileMedia()),
  );
  const activeSrc = useMobileSources && mobileSrc ? mobileSrc : src;
  const sources = useMemo(() => (Array.isArray(activeSrc) ? activeSrc : [activeSrc]), [activeSrc]);
  const sourcesKey = sources.join("|");
  const playbackKey = playbackRateSchedule
    ? playbackRateSchedule.map(([start, rate]) => `${start}:${rate}`).join("|")
    : "";
  const xOffsetKey = xOffsetBySrc?.join("|") ?? "";
  const yOffsetKey = yOffsetBySrc?.join("|") ?? "";

  useEffect(() => {
    if (!mobileSrc) {
      return;
    }

    const syncSources = () => {
      setUseMobileSources(shouldUseMobileMedia());
    };

    syncSources();
    window.addEventListener("resize", syncSources);

    return () => window.removeEventListener("resize", syncSources);
  }, [mobileSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const standbyVideo = standbyVideoRef.current;

    if (!canvas || !video || !standbyVideo) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const sampler = document.createElement("canvas");
    const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });

    if (!ctx || !samplerCtx) {
      return;
    }

    let alive = true;
    let currentIndex = 0;
    let frameId = 0;
    let drawDelayTimer = 0;
    let lastFrameKey = -1;
    let lastDrawTime = 0;
    let transitionTimer = 0;
    let holdTimer = 0;
    let playbackMonitorTimer = 0;
    let videoWatchdogTimer = 0;
    let videoWarmupTimer = 0;
    let videoWarmupRetryTimer = 0;
    let scrollResumeTimer = 0;
    let pendingPaintCallback: (() => void) | null = null;
    let suppressSampleUntilTime = -1;
    let suppressSampleDeadline = 0;
    let endedLocked = false;
    let awaitingTransitionReveal = false;
    let scrollPaused = false;
    let activeVideo = video;
    let standby = standbyVideo;
    let currentSourceStartedAt = performance.now();
    let lastVideoTime = -1;
    let lastVideoProgressAt = currentSourceStartedAt;
    let playbackStallReported = false;
    let intersectionObserver: IntersectionObserver | null = null;
    let isInViewport = true;
    let pageVisible = document.visibilityState === "visible";
    const dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
    const buckets = new Map<number, Path2D>();
    let useBatchedRender = batched === true || (batched === "auto" && shouldBatchByDefault());
    const useDualVideoLoop = isTouchIOS() && sources.length === 1;
    const shouldPauseOffscreen =
      viewportPause === true ||
      (viewportPause === "desktop" && !window.matchMedia("(max-width: 640px)").matches);
    const shouldWarmSourceVideo = keepSourceVideoWarm;

    const clearTimers = () => {
      if (transitionTimer) {
        window.clearTimeout(transitionTimer);
        transitionTimer = 0;
      }
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = 0;
      }
      if (playbackMonitorTimer) {
        window.clearTimeout(playbackMonitorTimer);
        playbackMonitorTimer = 0;
      }
      if (drawDelayTimer) {
        window.clearTimeout(drawDelayTimer);
        drawDelayTimer = 0;
      }
      if (videoWatchdogTimer) {
        window.clearTimeout(videoWatchdogTimer);
        videoWatchdogTimer = 0;
      }
      if (videoWarmupTimer) {
        window.clearTimeout(videoWarmupTimer);
        videoWarmupTimer = 0;
      }
      if (videoWarmupRetryTimer) {
        window.clearTimeout(videoWarmupRetryTimer);
        videoWarmupRetryTimer = 0;
      }
      if (scrollResumeTimer) {
        window.clearTimeout(scrollResumeTimer);
        scrollResumeTimer = 0;
      }
    };

    const getDrawDelay = () => (maxRenderFps ? 1000 / maxRenderFps : 0);

    const prepareVideo = (target: HTMLVideoElement) => {
      target.muted = true;
      target.defaultMuted = true;
      target.autoplay = true;
      target.playsInline = true;
      target.preload = "auto";
      target.setAttribute("muted", "");
      target.setAttribute("autoplay", "");
      target.setAttribute("playsinline", "");
      target.setAttribute("webkit-playsinline", "");
    };

    const requestPlayback = (target = activeVideo) => {
      target.play().catch(() => {});
    };

    const noteVideoProgress = (time: number, now = performance.now()) => {
      if (time > lastVideoTime + 0.001) {
        lastVideoTime = time;
        lastVideoProgressAt = now;
      }
    };

    const monitorPlayback = () => {
      playbackMonitorTimer = 0;

      if (!alive || !pageVisible || !isInViewport || scrollPaused) {
        return;
      }

      if (!endedLocked) {
        requestPlayback();
      }

      const now = performance.now();
      const hasAdvanced = activeVideo.currentTime > 0.08;
      const hasLoadedFrame =
        activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA ||
        Boolean(activeVideo.videoWidth && activeVideo.videoHeight);
      const startupStalled =
        hasLoadedFrame &&
        !hasAdvanced &&
        now - currentSourceStartedAt > playbackStallFallbackMs;
      const activeStalled =
        hasLoadedFrame &&
        !activeVideo.paused &&
        now - lastVideoProgressAt > Math.max(playbackStallFallbackMs, 1600);

      if ((startupStalled || activeStalled) && !playbackStallReported) {
        playbackStallReported = true;
        onPlaybackStall?.();
      }

      playbackMonitorTimer = window.setTimeout(
        monitorPlayback,
        hasAdvanced ? 1200 : 280,
      );
    };

    const startPlaybackMonitor = () => {
      if (!playbackMonitorTimer) {
        playbackMonitorTimer = window.setTimeout(monitorPlayback, 280);
      }
    };

    const scheduleDraw = (delayMs = 0) => {
      if (
        frameId ||
        drawDelayTimer ||
        !alive ||
        !pageVisible ||
        !isInViewport ||
        scrollPaused
      ) {
        return;
      }

      if (delayMs > 0) {
        drawDelayTimer = window.setTimeout(() => {
          drawDelayTimer = 0;
          if (!alive || !pageVisible || !isInViewport || scrollPaused || frameId) {
            return;
          }
          frameId = window.requestAnimationFrame(draw);
        }, delayMs);
        return;
      }

      frameId = window.requestAnimationFrame(draw);
    };

    const clearCanvas = () => {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = darkMode ? "#000" : "#fff";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.restore();
    };

    const primeStandby = (target: HTMLVideoElement) => {
      target.pause();
      target.src = sources[0];
      prepareVideo(target);
      try {
        target.currentTime = 0;
      } catch {}
      target.load();
    };

    const applyVideoTransform = () => {
      const t = activeVideo.currentTime;
      let rate = 1;

      playbackRateSchedule?.forEach(([start, nextRate]) => {
        if (t >= start) {
          rate = nextRate;
        }
      });

      if (activeVideo.playbackRate !== rate) {
        activeVideo.playbackRate = rate;
      }

      const x = useMobileSources
        ? mobileXOffsetBySrc?.[currentIndex] ?? xOffsetBySrc?.[currentIndex] ?? "0%"
        : xOffsetBySrc?.[currentIndex] ?? "0%";
      const y = useMobileSources
        ? mobileYOffsetBySrc?.[currentIndex] ?? yOffsetBySrc?.[currentIndex] ?? "0%"
        : yOffsetBySrc?.[currentIndex] ?? "0%";
      const effectiveScale = useMobileSources && mobileScale ? mobileScale : scale;
      const transform = `translate(${x}, ${y}) scale(${effectiveScale})`;

      if (canvas.style.transform !== transform) {
        canvas.style.transform = transform;
      }
    };

    const sizeCanvas = (width: number, height: number) => {
      const nextWidth = Math.max(1, Math.floor(width * dpr));
      const nextHeight = Math.max(1, Math.floor(height * dpr));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        lastFrameKey = -1;
      }
    };

    const draw = (now = performance.now()) => {
      frameId = 0;

      if (!alive) {
        return;
      }

      if (!pageVisible || !isInViewport || scrollPaused) {
        return;
      }

      const drawDelay = getDrawDelay();

      if (drawDelay > 0 && lastDrawTime > 0) {
        const elapsed = now - lastDrawTime;

        if (elapsed < drawDelay) {
          scheduleDraw(drawDelay - elapsed);
          return;
        }
      }

      const sourceVideo = activeVideo;
      const videoWidth = sourceVideo.videoWidth;
      const videoHeight = sourceVideo.videoHeight;
      const currentTime = sourceVideo.currentTime;
      noteVideoProgress(currentTime, now);

      if (!videoWidth || !videoHeight || sourceVideo.readyState < 2) {
        scheduleDraw(drawDelay || 16);
        return;
      }

      if (suppressSampleUntilTime >= 0) {
        const hasFreshFrame = currentTime > suppressSampleUntilTime + 0.001;
        const timedOut = now > suppressSampleDeadline;

        if (hasFreshFrame || timedOut) {
          suppressSampleUntilTime = -1;
          pendingPaintCallback = () => {
            awaitingTransitionReveal = false;
            reveal();
          };
        } else {
          scheduleDraw(drawDelay || 16);
          return;
        }
      }

      const frameKey = maxRenderFps
        ? Math.floor(sourceVideo.currentTime * maxRenderFps)
        : sourceVideo.currentTime;

      if (frameKey === lastFrameKey) {
        if (pendingPaintCallback) {
          const callback = pendingPaintCallback;
          pendingPaintCallback = null;
          callback();
        }

        scheduleDraw(drawDelay ? Math.max(4, drawDelay * 0.5) : 0);
        return;
      }

      lastFrameKey = frameKey;
      lastDrawTime = now;
      applyVideoTransform();

      const container = canvas.parentElement;
      const width = container?.clientWidth || 600;
      const height = container?.clientHeight || 400;
      const effectiveCols = window.innerWidth < 760 ? (mobileCols ?? Math.min(cols, 170)) : cols;
      const cell = width / effectiveCols;
      const rows = Math.max(1, Math.ceil(height / cell));
      const cellY = height / rows;
      const videoAspect = videoWidth / videoHeight;
      const gridAspect = width / height;
      const effectiveFitMode = useMobileSources && mobileFitMode
        ? mobileFitMode
        : fitMode;
      const effectiveCropXBias = useMobileSources
        ? mobileCropXBiasBySrc?.[currentIndex] ?? mobileCropXBias ?? cropXBias
        : cropXBias;
      const effectiveCropYBias = useMobileSources
        ? mobileCropYBiasBySrc?.[currentIndex] ?? mobileCropYBias ?? cropYBias
        : cropYBias;
      const effectiveSampleScale = useMobileSources
        ? mobileSampleScaleBySrc?.[currentIndex] ?? sampleScaleBySrc?.[currentIndex] ?? mobileSampleScale ?? sampleScale
        : sampleScaleBySrc?.[currentIndex] ?? sampleScale;
      const effectiveSampleXOffsetRatio = useMobileSources
        ? mobileSampleXOffsetRatioBySrc?.[currentIndex] ?? sampleXOffsetRatioBySrc?.[currentIndex] ?? 0
        : sampleXOffsetRatioBySrc?.[currentIndex] ?? 0;
      const effectiveSampleYOffsetRatio = useMobileSources
        ? mobileSampleYOffsetRatioBySrc?.[currentIndex] ?? sampleYOffsetRatioBySrc?.[currentIndex] ?? 0
        : sampleYOffsetRatioBySrc?.[currentIndex] ?? 0;
      let cropX = 0;
      let cropY = 0;
      let cropW = videoWidth;
      let cropH = videoHeight;

      if (effectiveFitMode === "cover" && gridAspect > videoAspect) {
        cropH = videoWidth / gridAspect;
        cropY = (videoHeight - cropH) * clamp(0.5 + effectiveCropYBias / 2, 0, 1);
      } else if (effectiveFitMode === "cover") {
        cropW = videoHeight * gridAspect;
        cropX = (videoWidth - cropW) * clamp(0.5 + effectiveCropXBias / 2, 0, 1);
      }

      sizeCanvas(width, height);

      if (sampler.width !== effectiveCols || sampler.height !== rows) {
        sampler.width = effectiveCols;
        sampler.height = rows;
      }

      if (effectiveFitMode === "contain") {
        samplerCtx.fillStyle = "#000";
        samplerCtx.fillRect(0, 0, effectiveCols, rows);

        const sampleAspect = effectiveCols / rows;
        const baseDrawW = sampleAspect > videoAspect
          ? Math.max(1, Math.round(rows * videoAspect))
          : effectiveCols;
        const baseDrawH = sampleAspect > videoAspect
          ? rows
          : Math.max(1, Math.round(effectiveCols / videoAspect));
        const drawW = Math.max(1, Math.round(baseDrawW * effectiveSampleScale));
        const drawH = Math.max(1, Math.round(baseDrawH * effectiveSampleScale));
        const drawX = Math.round(
          (effectiveCols - drawW) * clamp(0.5 + effectiveCropXBias / 2, 0, 1),
        ) + Math.round(effectiveCols * effectiveSampleXOffsetRatio);
        const drawY = Math.round(
          (rows - drawH) * clamp(0.5 + effectiveCropYBias / 2, 0, 1),
        ) + Math.round(rows * effectiveSampleYOffsetRatio);

        samplerCtx.drawImage(
          sourceVideo,
          0,
          0,
          videoWidth,
          videoHeight,
          drawX,
          drawY,
          drawW,
          drawH,
        );
      } else {
        samplerCtx.drawImage(
          sourceVideo,
          cropX,
          cropY,
          cropW,
          cropH,
          0,
          0,
          effectiveCols,
          rows,
        );
      }

      const pixels = samplerCtx.getImageData(0, 0, effectiveCols, rows).data;
      const fixedRadius = binarySize ? cell * binarySizeScale : 0;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = darkMode ? "#000" : "#fff";
      ctx.fillRect(0, 0, width, height);
      if (useBatchedRender) {
        buckets.clear();
      }
      let fixedDiamond: Path2D | null = null;

      if (binarySize && !useBatchedRender) {
        fixedDiamond = new Path2D();
        fixedDiamond.moveTo(0, -fixedRadius);
        fixedDiamond.lineTo(fixedRadius, 0);
        fixedDiamond.lineTo(0, fixedRadius);
        fixedDiamond.lineTo(-fixedRadius, 0);
        fixedDiamond.closePath();
      }
      let lastR = -1;
      let lastG = -1;
      let lastB = -1;
      let lastAlpha = -1;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < effectiveCols; col += 1) {
          const index = (row * effectiveCols + col) * 4;
          const r = pixels[index];
          const g = pixels[index + 1];
          const b = pixels[index + 2];
          let luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

          if (invert) {
            luminance = 1 - luminance;
          }

          const darkness = 1 - luminance;

          if (darkness < threshold) {
            continue;
          }

          const alphaQ = clamp(
            Math.round((darkness - threshold) * (16 / 0.12)),
            0,
            16,
          );

          if (alphaQ <= 0) {
            continue;
          }

          let fr = r;
          let fg = g;
          let fb = b;
          const average = (r + g + b) / 3;

          if (pureColor) {
            fr = clamp((average + (r - average) * saturation) * 1.32, 0, 255);
            fg = clamp((average + (g - average) * saturation) * 1.1, 0, 255);
            fb = clamp((average + (b - average) * saturation) * 1.35, 0, 255);
          } else {
            fr = clamp(average + (r - average) * saturation, 0, 255);
            fg = clamp(average + (g - average) * saturation, 0, 255);
            fb = clamp(average + (b - average) * saturation, 0, 255);

            const targetLum = darkMode
              ? Math.max(150, darkness * 280)
              : Math.min(170, (1 - darkness) * 250);
            const currentLum = (fr + fg + fb) / 3;

            if (currentLum > 0) {
              const lumScale = targetLum / currentLum;
              fr = clamp(fr * lumScale, 0, 255);
              fg = clamp(fg * lumScale, 0, 255);
              fb = clamp(fb * lumScale, 0, 255);
            }
          }

          const cx = col * cell + cell / 2;
          const cy = row * cellY + cellY / 2;
          const radius = binarySize ? fixedRadius : Math.sqrt(darkness) * cell * 0.85;

          if (useBatchedRender) {
            const qr = Math.floor(fr) >> 4;
            const qg = Math.floor(fg) >> 4;
            const qb = Math.floor(fb) >> 4;
            const key = (qr << 13) | (qg << 9) | (qb << 5) | alphaQ;
            let path = buckets.get(key);

            if (!path) {
              path = new Path2D();
              buckets.set(key, path);
            }

            path.moveTo(cx, cy - radius);
            path.lineTo(cx + radius, cy);
            path.lineTo(cx, cy + radius);
            path.lineTo(cx - radius, cy);
            path.closePath();
          } else {
            const nextR = Math.floor(fr);
            const nextG = Math.floor(fg);
            const nextB = Math.floor(fb);
            const nextAlpha = alphaQ / 16;

            if (nextR !== lastR || nextG !== lastG || nextB !== lastB) {
              ctx.fillStyle = `rgb(${nextR},${nextG},${nextB})`;
              lastR = nextR;
              lastG = nextG;
              lastB = nextB;
            }

            if (nextAlpha !== lastAlpha) {
              ctx.globalAlpha = nextAlpha;
              lastAlpha = nextAlpha;
            }

            if (fixedDiamond) {
              ctx.translate(cx, cy);
              ctx.fill(fixedDiamond);
              ctx.translate(-cx, -cy);
            } else {
              ctx.beginPath();
              ctx.moveTo(cx, cy - radius);
              ctx.lineTo(cx + radius, cy);
              ctx.lineTo(cx, cy + radius);
              ctx.lineTo(cx - radius, cy);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      }

      if (useBatchedRender) {
        ctx.globalAlpha = 1;
        buckets.forEach((path, key) => {
          const qr = (key >> 13) & 15;
          const qg = (key >> 9) & 15;
          const qb = (key >> 5) & 15;
          const alphaQ = key & 31;
          const r8 = (qr << 4) | qr;
          const g8 = (qg << 4) | qg;
          const b8 = (qb << 4) | qb;
          ctx.fillStyle = `rgba(${r8},${g8},${b8},${alphaQ / 16})`;
          ctx.fill(path);
        });
      }

      ctx.restore();

      if (pendingPaintCallback) {
        const callback = pendingPaintCallback;
        pendingPaintCallback = null;
        callback();
      }

      scheduleDraw();
    };

    const startDrawing = () => {
      scheduleDraw();
    };

    const wakeVideo = () => {
      if (!alive || !pageVisible || !isInViewport || scrollPaused) {
        return;
      }

      if (activeVideo.paused && !endedLocked) {
        requestPlayback();
      }

      lastFrameKey = -1;
      startDrawing();
      startPlaybackMonitor();
    };

    const stopDrawing = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      if (drawDelayTimer) {
        window.clearTimeout(drawDelayTimer);
        drawDelayTimer = 0;
      }
    };

    const handleScroll = () => {
      if (!pauseWhileScrolling || !isInViewport) {
        wakeVideo();
        return;
      }

      scrollPaused = true;
      stopDrawing();

      if (scrollResumeTimer) {
        window.clearTimeout(scrollResumeTimer);
      }

      scrollResumeTimer = window.setTimeout(() => {
        scrollResumeTimer = 0;
        scrollPaused = false;
        wakeVideo();
      }, 140);
    };

    const startSource = (index: number) => {
      currentIndex = index;
      currentSourceStartedAt = performance.now();
      lastVideoTime = -1;
      lastVideoProgressAt = currentSourceStartedAt;
      playbackStallReported = false;
      prepareVideo(activeVideo);
      activeVideo.loop = sources.length === 1 && endHoldMs <= 0 && !useDualVideoLoop;
      const startTime = useMobileSources
        ? mobileStartTimeBySrc?.[currentIndex] ?? startTimeBySrc?.[currentIndex] ?? 0
        : startTimeBySrc?.[currentIndex] ?? 0;
      activeVideo.src = sources[currentIndex];
      activeVideo.load();
      if (startTime > 0) {
        let playbackRequestedAfterSeek = false;
        const seekToStart = () => {
          try {
            activeVideo.currentTime = Math.min(
              startTime,
              Math.max(0, (activeVideo.duration || startTime + 1) - 0.8),
            );
          } catch {}
        };
        const seekAndPlay = () => {
          const playAfterSeek = () => {
            activeVideo.removeEventListener("seeked", playAfterSeek);
            requestPlaybackAfterSeek();
          };

          activeVideo.addEventListener("seeked", playAfterSeek, { once: true });
          seekToStart();
          window.setTimeout(() => {
            if (!playbackRequestedAfterSeek) {
              activeVideo.removeEventListener("seeked", playAfterSeek);
              requestPlaybackAfterSeek();
            }
          }, 260);
        };
        const requestPlaybackAfterSeek = () => {
          if (playbackRequestedAfterSeek) {
            return;
          }

          playbackRequestedAfterSeek = true;
          requestPlayback();
          startPlaybackMonitor();
        };

        if (activeVideo.readyState >= HTMLMediaElement.HAVE_METADATA) {
          seekAndPlay();
        } else {
          activeVideo.addEventListener(
            "loadedmetadata",
            () => {
              seekAndPlay();
            },
            { once: true },
          );
        }
        return;
      }
      requestPlayback();
      startPlaybackMonitor();
    };

    const reveal = () => {
      canvas.style.opacity = "1";
    };

    const hide = () => {
      canvas.style.opacity = "0";
    };

    const handleCanPlay = () => {
      requestPlayback();

      if (!awaitingTransitionReveal) {
        reveal();
      }
    };

    const swapDualVideoLoop = () => {
      const oldVideo = activeVideo;
      activeVideo = standby;
      standby = oldVideo;
      requestPlayback();
      primeStandby(standby);
      lastFrameKey = -1;
    };

    const handleEnded = () => {
      if (endedLocked) {
        return;
      }

      endedLocked = true;

      if (sources.length === 1) {
        onPlaybackCycleComplete?.();
        if (useDualVideoLoop) {
          swapDualVideoLoop();
        }
        return;
      }

      hide();
      transitionTimer = window.setTimeout(() => {
        if (!alive) {
          return;
        }

        clearCanvas();
        lastFrameKey = -1;
        awaitingTransitionReveal = true;
        suppressSampleUntilTime = 0;
        suppressSampleDeadline = performance.now() + 1000;
        startSource((currentIndex + 1) % sources.length);
        endedLocked = false;
      }, 400);
    };

    const handlePlay = () => {
      endedLocked = false;
    };

    const handleTimeUpdate = () => {
      if (!activeVideo.duration || Number.isNaN(activeVideo.duration)) {
        return;
      }

      const endTime = useMobileSources
        ? mobileEndTimeBySrc?.[currentIndex] ?? endTimeBySrc?.[currentIndex] ?? activeVideo.duration
        : endTimeBySrc?.[currentIndex] ?? activeVideo.duration;
      const effectiveEndTime = Math.min(activeVideo.duration, endTime);
      const remaining = effectiveEndTime - activeVideo.currentTime;

      if (sources.length > 1 && remaining < 0.4) {
        handleEnded();
        return;
      }

      if (sources.length === 1 && endHoldMs > 0 && remaining < 0.15 && !endedLocked) {
        endedLocked = true;
        activeVideo.pause();
        reveal();
        holdTimer = window.setTimeout(() => {
          onPlaybackCycleComplete?.();
          hide();
          holdTimer = window.setTimeout(() => {
            if (!alive) {
              return;
            }

            clearCanvas();
            try {
              activeVideo.currentTime = 0;
            } catch {}
            lastFrameKey = -1;
            requestPlayback();
            endedLocked = false;
          }, 250);
        }, endHoldMs);
      }
    };

    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 400ms ease";
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("canplaythrough", wakeVideo);
    video.addEventListener("loadeddata", wakeVideo);
    video.addEventListener("loadedmetadata", wakeVideo);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("playing", wakeVideo);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("stalled", wakeVideo);
    video.addEventListener("waiting", wakeVideo);
    video.addEventListener("suspend", wakeVideo);
    standbyVideo.addEventListener("ended", handleEnded);

    if (useDualVideoLoop) {
      primeStandby(standbyVideo);
    }

    startSource(0);
    startDrawing();

    if (shouldWarmSourceVideo) {
      wakeVideo();
      videoWarmupTimer = window.setTimeout(wakeVideo, 180);
      videoWarmupRetryTimer = window.setTimeout(wakeVideo, 560);
      videoWatchdogTimer = window.setTimeout(wakeVideo, 1100);
    }

    const handleResize = () => {
      lastFrameKey = -1;
      useBatchedRender = batched === true || (batched === "auto" && shouldBatchByDefault());
    };

    const handleVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";

      if (pageVisible) {
        wakeVideo();
      } else {
        stopDrawing();
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("focus", wakeVideo);
    window.addEventListener("pageshow", wakeVideo);
    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (shouldPauseOffscreen && "IntersectionObserver" in window) {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          isInViewport = entry?.isIntersecting ?? true;

          if (isInViewport) {
            wakeVideo();
          } else {
            stopDrawing();
          }
        },
        {
          rootMargin: "22% 0px 22% 0px",
          threshold: 0,
        },
      );
      intersectionObserver.observe(canvas);
    }

    return () => {
      alive = false;
      stopDrawing();
      clearTimers();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("focus", wakeVideo);
      window.removeEventListener("pageshow", wakeVideo);
      document.removeEventListener("scroll", handleScroll, {
        capture: true,
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      intersectionObserver?.disconnect();
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("canplaythrough", wakeVideo);
      video.removeEventListener("loadeddata", wakeVideo);
      video.removeEventListener("loadedmetadata", wakeVideo);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("playing", wakeVideo);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("stalled", wakeVideo);
      video.removeEventListener("waiting", wakeVideo);
      video.removeEventListener("suspend", wakeVideo);
      standbyVideo.removeEventListener("ended", handleEnded);
      video.pause();
      standbyVideo.pause();
    };
  }, [
    batched,
    binarySize,
    binarySizeScale,
    cols,
    cropXBias,
    cropYBias,
    darkMode,
    endTimeBySrc,
    endHoldMs,
    fitMode,
    invert,
    keepSourceVideoWarm,
    maxRenderFps,
    mobileCols,
    mobileCropXBias,
    mobileCropXBiasBySrc,
    mobileCropYBias,
    mobileCropYBiasBySrc,
    mobileEndTimeBySrc,
    mobileFitMode,
    mobileScale,
    mobileSampleScale,
    mobileSampleScaleBySrc,
    mobileSampleXOffsetRatioBySrc,
    mobileSampleYOffsetRatioBySrc,
    mobileStartTimeBySrc,
    mobileXOffsetBySrc,
    mobileYOffsetBySrc,
    maxDevicePixelRatio,
    onPlaybackCycleComplete,
    onPlaybackStall,
    pauseWhileScrolling,
    playbackStallFallbackMs,
    playbackKey,
    playbackRateSchedule,
    pureColor,
    saturation,
    scale,
    sampleScale,
    sampleScaleBySrc,
    sampleXOffsetRatioBySrc,
    sampleYOffsetRatioBySrc,
    sources,
    sourcesKey,
    startTimeBySrc,
    threshold,
    useMobileSources,
    viewportPause,
    xOffsetBySrc,
    xOffsetKey,
    yOffsetBySrc,
    yOffsetKey,
  ]);

  return (
    <div
      className={[className, keepSourceVideoWarm ? "ascii-video-dither--warm-source" : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: darkMode ? "#000" : "#fff",
        height: "100%",
        width: "100%",
      }}
    >
      <video
        ref={videoRef}
        aria-hidden="true"
        autoPlay
        muted
        playsInline
        preload="auto"
        src={sources[0]}
        className="ascii-video-dither__source"
      />
      <video
        ref={standbyVideoRef}
        aria-hidden="true"
        autoPlay
        muted
        playsInline
        preload="auto"
        className="ascii-video-dither__source"
      />
      <canvas ref={canvasRef} className="ascii-video-dither__canvas" />
    </div>
  );
}
