import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Scan, AlertTriangle, Crosshair, Zap, Shield, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HUDOverlayProps {
  isActive: boolean;
  onToggle: () => void;
  isScanning: boolean;
  onScanToggle: () => void;
  suitMode?: boolean;
  onSuitToggle?: () => void;
  gestureEnabled?: boolean;
  onGestureToggle?: () => void;
  onGestureAction?: (gesture: string) => void;
}

interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  id: number;
  /** 0-1 opacity for fade-in/out */
  opacity: number;
  /** timestamp when first detected */
  firstSeen: number;
}

interface LockedTarget {
  detection: Detection;
  lockTime: number;
  stable: boolean;
}

type ScanState = 'idle' | 'initializing' | 'scanning' | 'analyzing' | 'complete';

// ── Drawing helpers ──

/** Draw animated corner brackets at rect edges */
function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, alpha: number, tick: number, bracketLen: number
) {
  const pulse = Math.sin(tick * 0.06) * 0.15 + 0.85;
  ctx.strokeStyle = `rgba(${color},${alpha * pulse})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = `rgba(${color},0.4)`;
  ctx.shadowBlur = 6;

  // Animated offset – brackets "breathe" slightly
  const breathe = Math.sin(tick * 0.03) * 2;
  const bl = bracketLen + breathe;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + bl); ctx.lineTo(x, y); ctx.lineTo(x + bl, y);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w - bl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + bl);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + h - bl); ctx.lineTo(x, y + h); ctx.lineTo(x + bl, y + h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w - bl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - bl);
  ctx.stroke();

  ctx.shadowBlur = 0;
}

/** Draw a rotating ring around a center point */
function drawRotatingRing(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  color: string, alpha: number, tick: number, speed: number, segments: number, gapRatio: number
) {
  const segAngle = (Math.PI * 2) / segments;
  const drawAngle = segAngle * (1 - gapRatio);
  ctx.strokeStyle = `rgba(${color},${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.shadowColor = `rgba(${color},0.3)`;
  ctx.shadowBlur = 4;

  for (let i = 0; i < segments; i++) {
    const startAngle = tick * speed + i * segAngle;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + drawAngle);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

/** Draw subtle grid behind detection */
function drawBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, alpha: number
) {
  ctx.strokeStyle = `rgba(${color},${alpha * 0.12})`;
  ctx.lineWidth = 0.5;
  const step = 12;
  for (let gx = x; gx <= x + w; gx += step) {
    ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += step) {
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
  }
}

/** Draw a glass-panel info box with slide-in */
function drawInfoPanel(
  ctx: CanvasRenderingContext2D,
  d: Detection, cx: number, cy: number, rx: number,
  canvasW: number, _canvasH: number,
  color: string, isLocked: boolean, stable: boolean,
  scanState: ScanState, tick: number, scanProgress: number
) {
  const pulse = Math.sin(tick * 0.05) * 0.15 + 0.85;
  // Slide-in: use opacity as proxy for age (0→1)
  const slideOffset = (1 - Math.min(d.opacity, 1)) * 40;

  // Auto-position: default right, flip left if near right edge
  const pw = 120, ph = isLocked ? 90 : 68;
  let panelX = cx + rx + 30 - slideOffset;
  let panelY = cy - ph / 2;
  let connFromX = cx + rx + 8;

  if (panelX + pw > canvasW - 10) {
    panelX = cx - rx - pw - 30 + slideOffset;
    connFromX = cx - rx - 8;
  }
  // Clamp Y
  panelY = Math.max(8, Math.min(panelY, _canvasH - ph - 8));

  // Glass background
  ctx.save();
  ctx.globalAlpha = d.opacity * pulse;
  ctx.fillStyle = `rgba(2,6,23,0.75)`;
  ctx.strokeStyle = `rgba(${color},0.5)`;
  ctx.lineWidth = 1;
  ctx.shadowColor = `rgba(${color},0.2)`;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, pw, ph, 4);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Connector line (thin, elegant)
  ctx.strokeStyle = `rgba(${color},${0.35 * pulse})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(connFromX, cy);
  ctx.lineTo(panelX < cx ? panelX + pw : panelX, panelY + ph / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Header line
  ctx.fillStyle = `rgba(${color},0.2)`;
  ctx.fillRect(panelX + 1, panelY + 18, pw - 2, 1);

  // Text content
  ctx.fillStyle = `rgba(${color},0.95)`;
  ctx.font = 'bold 9px monospace';
  ctx.fillText(isLocked ? '◉ TARGET LOCKED' : d.label.toUpperCase(), panelX + 8, panelY + 13);

  ctx.font = '8px monospace';
  ctx.fillStyle = `rgba(${color},0.6)`;
  ctx.fillText(`CONF: ${d.confidence}%`, panelX + 8, panelY + 30);
  ctx.fillText(`ID: ${String(d.id).padStart(4, '0')}`, panelX + 8, panelY + 42);

  const stateLabels: Record<ScanState, string> = {
    idle: 'STANDBY', initializing: 'INIT...', scanning: 'SCANNING',
    analyzing: 'ANALYZING', complete: 'COMPLETE'
  };
  ctx.fillText(`STATUS: ${stateLabels[scanState]}`, panelX + 8, panelY + 54);

  // Scan progress bar inside panel
  if (scanState === 'scanning') {
    const barX = panelX + 8, barY = panelY + 58, barW = pw - 16, barH = 3;
    ctx.fillStyle = `rgba(${color},0.15)`;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = `rgba(${color},0.7)`;
    ctx.fillRect(barX, barY, barW * (scanProgress / 100), barH);
  }

  if (isLocked) {
    ctx.fillStyle = stable ? 'rgba(34,197,94,0.9)' : 'rgba(250,204,21,0.8)';
    ctx.font = 'bold 8px monospace';
    const lockY = scanState === 'scanning' ? panelY + 74 : panelY + 66;
    ctx.fillText(stable ? '● LOCKED — STABLE' : '◌ ACQUIRING...', panelX + 8, lockY);

    // Lock duration
    const elapsed = ((Date.now() - d.firstSeen) / 1000).toFixed(1);
    ctx.fillStyle = `rgba(${color},0.4)`;
    ctx.font = '7px monospace';
    ctx.fillText(`LOCK: ${elapsed}s`, panelX + 8, lockY + 10);
  }

  ctx.restore();
}

const HUDOverlay = ({
  isActive, onToggle, isScanning, onScanToggle,
  suitMode = false, onSuitToggle,
  gestureEnabled = false, onGestureToggle, onGestureAction
}: HUDOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const holoCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const holoAnimRef = useRef<number>(0);
  const prevDetectionsRef = useRef<Detection[]>([]);
  const detectionIdRef = useRef(0);
  const lockedTargetRef = useRef<LockedTarget | null>(null);
  const gestureHistoryRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const gestureCooldownRef = useRef(0);
  const detectionTTLRef = useRef<Map<number, { det: Detection; framesLeft: number }>>(new Map());
  const frameSkipRef = useRef(0);
  const fpsHistoryRef = useRef<number[]>([]);

  const [detections, setDetections] = useState<Detection[]>([]);
  const [lockedTarget, setLockedTarget] = useState<LockedTarget | null>(null);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState({ w: 0, h: 0 });
  const [fps, setFps] = useState(0);
  const [performanceMode, setPerformanceMode] = useState(false);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });

  // ── HD Camera ──
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920, min: 1280 }, height: { ideal: 1080, min: 720 }, frameRate: { ideal: 30 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const s = stream.getVideoTracks()[0]?.getSettings();
        if (s?.width && s?.height) setResolution({ w: s.width, h: s.height });
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); setResolution({ w: 640, h: 480 }); }
      } catch (err) {
        setError('Camera access denied.');
        console.error('Camera error:', err);
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setDetections([]); setScanState('idle'); setScanProgress(0);
    setLockedTarget(null); lockedTargetRef.current = null;
  }, []);

  useEffect(() => { if (isActive) startCamera(); else stopCamera(); return () => stopCamera(); }, [isActive, startCamera, stopCamera]);

  // ── Scan state machine ──
  useEffect(() => {
    if (!isScanning) { setScanState('idle'); setScanProgress(0); return; }
    setScanState('initializing');
    const t1 = setTimeout(() => setScanState('scanning'), 1500);
    return () => clearTimeout(t1);
  }, [isScanning]);

  useEffect(() => {
    if (scanState !== 'scanning') return;
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          setScanState('analyzing');
          setTimeout(() => setScanState('complete'), 2000);
          setTimeout(() => { setScanState('scanning'); setScanProgress(0); }, 4000);
          return 100;
        }
        return p + 0.5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [scanState]);

  // ── Performance mode: auto-reduce effects when FPS drops ──
  useEffect(() => {
    const hist = fpsHistoryRef.current;
    hist.push(fps);
    if (hist.length > 10) hist.shift();
    const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
    setPerformanceMode(avg > 0 && avg < 18);
  }, [fps]);

  // ── TARGET LOCK ──
  const updateTargetLock = useCallback((dets: Detection[]) => {
    const now = Date.now();
    const current = lockedTargetRef.current;
    if (dets.length === 0) {
      if (current && now - current.lockTime > 1000) {
        lockedTargetRef.current = null;
        setLockedTarget(null);
      }
      return;
    }
    if (current) {
      const match = dets.find(d => d.id === current.detection.id) ||
        dets.find(d => Math.abs(d.x - current.detection.x) < 12 && Math.abs(d.y - current.detection.y) < 12);
      if (match) {
        const updated = { detection: match, lockTime: current.lockTime, stable: now - current.lockTime > 500 };
        lockedTargetRef.current = updated;
        setLockedTarget(updated);
        return;
      }
      if (now - current.lockTime < 2000) return;
    }
    const scored = dets.map(d => {
      const cx = d.x + d.width / 2 - 50;
      const cy = d.y + d.height / 2 - 50;
      return { d, score: d.confidence - Math.sqrt(cx * cx + cy * cy) * 0.5 };
    }).sort((a, b) => b.score - a.score);
    if (scored.length > 0) {
      const locked = { detection: scored[0].d, lockTime: now, stable: false };
      lockedTargetRef.current = locked;
      setLockedTarget(locked);
    }
  }, []);

  // ── Motion detection + tracking + gesture detection ──
  useEffect(() => {
    if (!isActive || !isScanning) return;
    let prevImageData: ImageData | null = null;
    const PERSISTENCE_FRAMES = 12;
    const SMOOTHING = 0.75;
    const MIN_BLOCKS = 4;
    const MOTION_THRESHOLD = 30;

    const detect = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) { animFrameRef.current = requestAnimationFrame(detect); return; }

      frameSkipRef.current++;
      if (frameSkipRef.current % 2 !== 0) {
        fpsCounterRef.current.frames++;
        const now = performance.now();
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          setFps(fpsCounterRef.current.frames);
          fpsCounterRef.current = { frames: 0, lastTime: now };
        }
        animFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      fpsCounterRef.current.frames++;
      const now = performance.now();
      if (now - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current = { frames: 0, lastTime: now };
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const aw = 320, ah = 240;
      canvas.width = aw; canvas.height = ah;
      ctx.drawImage(video, 0, 0, aw, ah);
      const imageData = ctx.getImageData(0, 0, aw, ah);

      if (prevImageData) {
        const blockSize = 20;
        const motionBlocks: { x: number; y: number; diff: number }[] = [];

        for (let y = 0; y < ah; y += blockSize) {
          for (let x = 0; x < aw; x += blockSize) {
            let diff = 0, count = 0;
            for (let by = 0; by < blockSize && y + by < ah; by += 2) {
              for (let bx = 0; bx < blockSize && x + bx < aw; bx += 2) {
                const idx = ((y + by) * aw + (x + bx)) * 4;
                diff += Math.abs(imageData.data[idx] - prevImageData.data[idx])
                  + Math.abs(imageData.data[idx + 1] - prevImageData.data[idx + 1])
                  + Math.abs(imageData.data[idx + 2] - prevImageData.data[idx + 2]);
                count++;
              }
            }
            if (count > 0 && diff / count > MOTION_THRESHOLD) motionBlocks.push({ x, y, diff: diff / count });
          }
        }

        // Gesture detection
        if (gestureEnabled && motionBlocks.length > 3 && Date.now() > gestureCooldownRef.current) {
          const avgX = motionBlocks.reduce((s, b) => s + b.x, 0) / motionBlocks.length;
          const avgY = motionBlocks.reduce((s, b) => s + b.y, 0) / motionBlocks.length;
          const hist = gestureHistoryRef.current;
          hist.push({ x: avgX, y: avgY, t: Date.now() });
          if (hist.length > 15) hist.shift();
          if (hist.length >= 8) {
            const first = hist[0], last = hist[hist.length - 1];
            const dx = last.x - first.x, dy = last.y - first.y;
            const dt = last.t - first.t;
            if (dt < 800 && dt > 100) {
              if (Math.abs(dx) > 80 && Math.abs(dy) < 40) {
                onGestureAction?.(dx > 0 ? 'swipe_left' : 'swipe_right');
                gestureHistoryRef.current = [];
                gestureCooldownRef.current = Date.now() + 1500;
              } else if (Math.abs(dy) > 60 && Math.abs(dx) < 40) {
                onGestureAction?.(dy > 0 ? 'swipe_down' : 'swipe_up');
                gestureHistoryRef.current = [];
                gestureCooldownRef.current = Date.now() + 1500;
              }
            }
          }
          if (motionBlocks.length > 25) {
            const spread = motionBlocks.reduce((s, b) => s + Math.abs(b.x - avgX) + Math.abs(b.y - avgY), 0) / motionBlocks.length;
            if (spread > 50) {
              onGestureAction?.('open_palm');
              gestureCooldownRef.current = Date.now() + 2000;
            }
          }
        }

        // Clustering
        const clusters: { minX: number; minY: number; maxX: number; maxY: number; blocks: number; totalDiff: number }[] = [];
        const used = new Set<number>();
        for (let i = 0; i < motionBlocks.length; i++) {
          if (used.has(i)) continue;
          let minX = motionBlocks[i].x, minY = motionBlocks[i].y;
          let maxX = minX + blockSize, maxY = minY + blockSize;
          let blockCount = 1, totalDiff = motionBlocks[i].diff;
          used.add(i);
          let changed = true;
          while (changed) {
            changed = false;
            for (let j = 0; j < motionBlocks.length; j++) {
              if (used.has(j)) continue;
              const b = motionBlocks[j];
              if (b.x >= minX - blockSize * 2 && b.x <= maxX + blockSize && b.y >= minY - blockSize * 2 && b.y <= maxY + blockSize) {
                minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
                maxX = Math.max(maxX, b.x + blockSize); maxY = Math.max(maxY, b.y + blockSize);
                blockCount++; totalDiff += b.diff; used.add(j);
                changed = true;
              }
            }
          }
          if (blockCount >= MIN_BLOCKS) clusters.push({ minX, minY, maxX, maxY, blocks: blockCount, totalDiff });
        }

        const nowMs = Date.now();
        const freshDetections: Detection[] = clusters.map(c => {
          const xPct = (c.minX / aw) * 100, yPct = (c.minY / ah) * 100;
          const wPct = ((c.maxX - c.minX) / aw) * 100, hPct = ((c.maxY - c.minY) / ah) * 100;
          const confidence = Math.min(99, 50 + c.blocks * 2);
          let label = 'Motion';
          if (wPct > 15 && hPct > 20) label = 'Subject';
          if (wPct > 25 && hPct > 35) label = 'Primary Target';
          if (yPct < 30 && wPct < 20 && hPct < 25) label = 'Face';
          if (yPct > 50 && wPct < 15) label = 'Hand';
          if (wPct > 10 && wPct < 25 && hPct > 25) label = 'Body';

          const prev = prevDetectionsRef.current.find(p => Math.abs(p.x - xPct) < 20 && Math.abs(p.y - yPct) < 20);
          return {
            x: prev ? prev.x * SMOOTHING + xPct * (1 - SMOOTHING) : xPct,
            y: prev ? prev.y * SMOOTHING + yPct * (1 - SMOOTHING) : yPct,
            width: prev ? prev.width * SMOOTHING + wPct * (1 - SMOOTHING) : wPct,
            height: prev ? prev.height * SMOOTHING + hPct * (1 - SMOOTHING) : hPct,
            label, confidence,
            id: prev?.id ?? ++detectionIdRef.current,
            opacity: prev ? Math.min(prev.opacity + 0.08, 1) : 0.1, // Fade-in
            firstSeen: prev?.firstSeen ?? nowMs,
          };
        });

        // Persistence with fade-out
        const ttlMap = detectionTTLRef.current;
        const usedIds = new Set<number>();
        for (const fd of freshDetections) {
          usedIds.add(fd.id);
          ttlMap.set(fd.id, { det: fd, framesLeft: PERSISTENCE_FRAMES });
        }
        for (const [id, entry] of ttlMap.entries()) {
          if (!usedIds.has(id)) {
            entry.framesLeft--;
            // Fade out opacity as TTL decreases
            entry.det = { ...entry.det, opacity: Math.max(0, entry.det.opacity - 0.06) };
            if (entry.framesLeft <= 0) ttlMap.delete(id);
          }
        }

        const finalDetections = Array.from(ttlMap.values()).map(e => e.det);
        prevDetectionsRef.current = finalDetections;
        setDetections(finalDetections);
        updateTargetLock(finalDetections);
      }

      prevImageData = imageData;
      animFrameRef.current = requestAnimationFrame(detect);
    };

    animFrameRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isActive, isScanning, gestureEnabled, onGestureAction, updateTargetLock]);

  // ═══════════════════════════════════════════════
  // ── ENHANCED HOLOGRAPHIC CANVAS RENDERING ──
  // ═══════════════════════════════════════════════
  useEffect(() => {
    if (!isActive) return;
    const canvas = holoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let tick = 0;

    const drawHolo = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      tick++;

      const lt = lockedTargetRef.current;
      const lowDetail = performanceMode;

      // ═══ BACKGROUND LAYER (depth: back) ═══

      // Subtle vignette
      if (!lowDetail) {
        const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.7);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);
      }

      // ═══ SCAN SWEEP (depth: mid-back) ═══
      if (isScanning) {
        const scanY = (tick * 2) % (H + 80) - 40;
        const grad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
        grad.addColorStop(0, 'rgba(6,182,212,0)');
        grad.addColorStop(0.3, 'rgba(6,182,212,0.04)');
        grad.addColorStop(0.5, 'rgba(6,182,212,0.15)');
        grad.addColorStop(0.7, 'rgba(6,182,212,0.04)');
        grad.addColorStop(1, 'rgba(6,182,212,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 40, W, 80);

        // Thin bright line at center of sweep
        ctx.strokeStyle = 'rgba(6,182,212,0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(W, scanY);
        ctx.stroke();
      }

      // ═══ DETECTION OVERLAYS (depth: mid + foreground) ═══
      for (const d of detections) {
        if (d.opacity <= 0.01) continue;

        const dx = (d.x / 100) * W;
        const dy = (d.y / 100) * H;
        const dw = (d.width / 100) * W;
        const dh = (d.height / 100) * H;
        const cx = dx + dw / 2;
        const cy = dy + dh / 2;
        const isLocked = lt && lt.detection.id === d.id;
        const stable = isLocked && lt!.stable;
        const color = stable ? '34,197,94' : isLocked ? '250,204,21' : '6,182,212';
        const alpha = d.opacity;

        ctx.save();
        ctx.globalAlpha = alpha;

        // ── Background: grid projection behind object ──
        if (!lowDetail) {
          drawBackgroundGrid(ctx, dx - 8, dy - 8, dw + 16, dh + 16, color, alpha);
        }

        // ── Mid-layer: glowing bounding box with pulse ──
        const boxPulse = Math.sin(tick * 0.08) * 0.2 + 0.8;
        ctx.strokeStyle = `rgba(${color},${0.5 * boxPulse * alpha})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = `rgba(${color},${0.3 * alpha})`;
        ctx.shadowBlur = lowDetail ? 4 : 10;
        ctx.strokeRect(dx - 4, dy - 4, dw + 8, dh + 8);
        ctx.shadowBlur = 0;

        // ── Mid-layer: animated corner brackets ──
        drawCornerBrackets(ctx, dx - 6, dy - 6, dw + 12, dh + 12, color, alpha * 0.9, tick, 14);

        // ── Mid-layer: rotating rings around object center ──
        if (!lowDetail) {
          const ringR = Math.max(dw, dh) / 2 + 20;
          // Outer ring: slow clockwise
          drawRotatingRing(ctx, cx, cy, ringR, color, 0.3 * alpha, tick, 0.015, 8, 0.4);
          // Inner ring: faster counter-clockwise
          drawRotatingRing(ctx, cx, cy, ringR - 10, color, 0.2 * alpha, tick, -0.025, 6, 0.35);
        }

        // ── Mid-layer: horizontal scan line across object ──
        if (isScanning) {
          const localScanY = dy + ((tick * 1.5) % (dh + 20)) - 10;
          if (localScanY > dy && localScanY < dy + dh) {
            const scanGrad = ctx.createLinearGradient(dx, 0, dx + dw, 0);
            scanGrad.addColorStop(0, `rgba(${color},0)`);
            scanGrad.addColorStop(0.3, `rgba(${color},${0.3 * alpha})`);
            scanGrad.addColorStop(0.7, `rgba(${color},${0.3 * alpha})`);
            scanGrad.addColorStop(1, `rgba(${color},0)`);
            ctx.fillStyle = scanGrad;
            ctx.fillRect(dx, localScanY - 1, dw, 2);
          }
        }

        // ── Stable lock: extra pulsing ring ──
        if (stable && !lowDetail) {
          const lockPulse = Math.sin(tick * 0.1) * 0.3 + 0.7;
          ctx.strokeStyle = `rgba(34,197,94,${lockPulse * 0.5 * alpha})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          const lockR = Math.max(dw, dh) / 2 + 30;
          ctx.beginPath();
          ctx.arc(cx, cy, lockR, tick * 0.008, tick * 0.008 + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // ── Radiating data lines ──
        if (!lowDetail) {
          ctx.strokeStyle = `rgba(${color},${0.15 * alpha})`;
          ctx.lineWidth = 0.5;
          const lineR1 = Math.max(dw, dh) / 2 + 24;
          const lineR2 = lineR1 + 14;
          for (let i = 0; i < 8; i++) {
            const a = tick * 0.01 + (i * Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * lineR1, cy + Math.sin(a) * lineR1);
            ctx.lineTo(cx + Math.cos(a) * lineR2, cy + Math.sin(a) * lineR2);
            ctx.stroke();
          }
        }

        // ── "TARGET LOCKED" label (top of object) ──
        if (isLocked) {
          const labelText = stable ? 'TARGET LOCKED' : 'ACQUIRING...';
          ctx.font = 'bold 10px monospace';
          const tm = ctx.measureText(labelText);
          const lx = cx - tm.width / 2 - 6;
          const ly = dy - 22;
          ctx.fillStyle = `rgba(2,6,23,${0.8 * alpha})`;
          ctx.strokeStyle = `rgba(${color},${0.6 * alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(lx, ly, tm.width + 12, 16, 3);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = stable ? `rgba(34,197,94,${0.95 * alpha})` : `rgba(250,204,21,${0.9 * alpha})`;
          ctx.fillText(labelText, lx + 6, ly + 12);
        }

        // ── Suit overlay (body parts only) ──
        if (suitMode && (d.label === 'Body' || d.label === 'Hand' || d.label === 'Primary Target') && !lowDetail) {
          const suitAlpha = Math.sin(tick * 0.04) * 0.15 + 0.35;
          ctx.save();
          ctx.translate(cx, cy);
          // Hexagonal armor pattern
          ctx.strokeStyle = `rgba(59,130,246,${suitAlpha * alpha})`;
          ctx.lineWidth = 1;
          const hexR = Math.min(dw, dh) * 0.2;
          for (let row = -1; row <= 1; row++) {
            for (let col = -1; col <= 1; col++) {
              const hx = col * hexR * 1.8 + (row % 2 ? hexR * 0.9 : 0);
              const hy = row * hexR * 1.5;
              ctx.beginPath();
              for (let v = 0; v < 6; v++) {
                const a = (Math.PI / 3) * v - Math.PI / 6;
                const method = v === 0 ? 'moveTo' : 'lineTo';
                ctx[method](hx + hexR * Math.cos(a) * 0.85, hy + hexR * Math.sin(a) * 0.85);
              }
              ctx.closePath();
              ctx.stroke();
            }
          }
          // Glow fill
          const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(dw, dh) / 2);
          grd.addColorStop(0, `rgba(59,130,246,${suitAlpha * 0.12 * alpha})`);
          grd.addColorStop(1, 'rgba(59,130,246,0)');
          ctx.fillStyle = grd;
          ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        }

        ctx.restore();

        // ── Foreground: floating info panel ──
        drawInfoPanel(
          ctx, d, cx, cy, dw / 2 + 8,
          W, H, color, !!isLocked, !!stable,
          scanState, tick, scanProgress
        );
      }

      // ── Corner hex patterns (ambient) ──
      if (!lowDetail) {
        ctx.strokeStyle = 'rgba(6,182,212,0.05)';
        ctx.lineWidth = 0.5;
        const hexSize = 14;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const hx = 20 + col * hexSize * 1.8 + (row % 2 ? hexSize * 0.9 : 0);
            const hy = 50 + row * hexSize * 1.6;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (Math.PI / 3) * i - Math.PI / 6;
              ctx[i === 0 ? 'moveTo' : 'lineTo'](hx + hexSize * Math.cos(a), hy + hexSize * Math.sin(a));
            }
            ctx.closePath(); ctx.stroke();
          }
        }
      }

      // ── Gesture indicator ──
      if (gestureEnabled) {
        ctx.fillStyle = 'rgba(168,85,247,0.7)';
        ctx.font = '9px monospace';
        ctx.fillText('◈ GESTURE CTRL ACTIVE', W - 155, H - 15);
      }

      // ── Performance mode indicator ──
      if (performanceMode) {
        ctx.fillStyle = 'rgba(250,204,21,0.6)';
        ctx.font = '8px monospace';
        ctx.fillText('⚡ PERF MODE', W - 90, 15);
      }

      holoAnimRef.current = requestAnimationFrame(drawHolo);
    };

    holoAnimRef.current = requestAnimationFrame(drawHolo);
    return () => cancelAnimationFrame(holoAnimRef.current);
  }, [isActive, isScanning, detections, suitMode, gestureEnabled, scanState, scanProgress, performanceMode]);

  const scanStateLabel: Record<ScanState, string> = { idle: 'STANDBY', initializing: 'INITIALIZING...', scanning: 'SCANNING', analyzing: 'ANALYZING DATA', complete: 'SCAN COMPLETE' };
  const scanStateColor: Record<ScanState, string> = { idle: 'text-cyan-400', initializing: 'text-yellow-400', scanning: 'text-green-400', analyzing: 'text-blue-400', complete: 'text-emerald-400' };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-cyan-500/30">
      <video ref={videoRef} className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`} playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      {isActive && <canvas ref={holoCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }} />}

      {/* Inactive */}
      {!isActive && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-2 border-cyan-500/20 flex items-center justify-center">
              <CameraOff className="h-10 w-10 text-cyan-500/40" />
            </div>
            <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping" />
          </div>
          <p className="text-cyan-500/40 text-sm font-mono">VISUAL FEED OFFLINE</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
          <div className="flex items-center gap-2 text-red-400 text-sm px-4"><AlertTriangle className="h-4 w-4" />{error}</div>
        </div>
      )}

      {/* HUD Overlay (HTML layer for crosshair + status) */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
          {/* Dynamic crosshair */}
          {(() => {
            const lt2 = lockedTarget;
            const target = lt2?.detection || detections[0];
            const cx = target ? target.x + target.width / 2 : 50;
            const cy = target ? target.y + target.height / 2 : 50;
            const isLk = lt2?.stable;
            return (
              <div className="absolute transition-all duration-300 ease-out" style={{ left: `${cx}%`, top: `${cy}%`, transform: 'translate(-50%, -50%)' }}>
                <div className="relative w-20 h-20">
                  <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: isLk ? '4s' : '8s' }}>
                    <circle cx="40" cy="40" r="36" fill="none" stroke={isLk ? 'rgba(34,197,94,0.5)' : 'rgba(6,182,212,0.3)'} strokeWidth={isLk ? 2 : 1} strokeDasharray="8 12" />
                  </svg>
                  <div className={`absolute top-0 left-1/2 -translate-x-px w-0.5 h-5 bg-gradient-to-b ${isLk ? 'from-green-400/80' : 'from-cyan-400/80'} to-transparent`} />
                  <div className={`absolute bottom-0 left-1/2 -translate-x-px w-0.5 h-5 bg-gradient-to-t ${isLk ? 'from-green-400/80' : 'from-cyan-400/80'} to-transparent`} />
                  <div className={`absolute left-0 top-1/2 -translate-y-px h-0.5 w-5 bg-gradient-to-r ${isLk ? 'from-green-400/80' : 'from-cyan-400/80'} to-transparent`} />
                  <div className={`absolute right-0 top-1/2 -translate-y-px h-0.5 w-5 bg-gradient-to-l ${isLk ? 'from-green-400/80' : 'from-cyan-400/80'} to-transparent`} />
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${isLk ? 'bg-green-400/80' : 'bg-cyan-400/80'}`} />
                </div>
              </div>
            );
          })()}

          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-cyan-400/50 rounded-tl-sm shadow-[0_0_8px_rgba(6,182,212,0.3)]" />
          <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-cyan-400/50 rounded-tr-sm shadow-[0_0_8px_rgba(6,182,212,0.3)]" />
          <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-cyan-400/50 rounded-bl-sm shadow-[0_0_8px_rgba(6,182,212,0.3)]" />
          <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-cyan-400/50 rounded-br-sm shadow-[0_0_8px_rgba(6,182,212,0.3)]" />

          {/* Lock status badge */}
          {lockedTarget && (
            <div className={`absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono backdrop-blur-sm border transition-all duration-300 ${
              lockedTarget.stable
                ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 animate-pulse'
            }`}>
              {lockedTarget.stable ? '● TARGET LOCKED' : '◌ ACQUIRING TARGET...'}
            </div>
          )}

          {/* Status info */}
          <div className="absolute top-4 left-14 space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${scanState === 'scanning' ? 'bg-green-400 animate-pulse' : scanState === 'analyzing' ? 'bg-blue-400 animate-pulse' : scanState === 'complete' ? 'bg-emerald-400' : scanState === 'initializing' ? 'bg-yellow-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span className={`text-[10px] font-mono ${scanStateColor[scanState]}`}>{scanStateLabel[scanState]}</span>
            </div>
            {isScanning && scanState === 'scanning' && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-100" style={{ width: `${scanProgress}%` }} />
                </div>
                <span className="text-[9px] text-cyan-400/60 font-mono">{Math.round(scanProgress)}%</span>
              </div>
            )}
          </div>

          <div className="absolute top-4 right-14 text-right">
            <div className="text-[10px] text-cyan-400/60 font-mono">{new Date().toLocaleTimeString()}</div>
            <div className="text-[9px] text-cyan-400/30 font-mono">{detections.length > 0 ? `${detections.length} TARGET${detections.length > 1 ? 'S' : ''}` : 'NO TARGETS'}</div>
          </div>

          <div className="absolute bottom-4 left-14 text-[10px] text-cyan-400/50 font-mono space-y-0.5">
            <div className="flex items-center gap-1"><Zap className="h-2.5 w-2.5" />RES: {resolution.w}x{resolution.h} | FPS: {fps || '—'}</div>
            <div>{resolution.w >= 1280 ? '● HD MODE' : '○ SD MODE'}{suitMode ? ' | ● SUIT' : ''}{gestureEnabled ? ' | ● GESTURE' : ''}</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-3 right-3 flex flex-wrap gap-2 justify-end" style={{ zIndex: 20 }}>
        <Button size="sm" onClick={onToggle} className={`${isActive ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30' : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border-cyan-500/30'} border text-xs backdrop-blur-sm`}>
          {isActive ? <CameraOff className="h-3 w-3 mr-1" /> : <Camera className="h-3 w-3 mr-1" />}
          {isActive ? 'Stop' : 'Start HD'}
        </Button>
        {isActive && (
          <>
            <Button size="sm" onClick={onScanToggle} className={`${isScanning ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'} border text-xs hover:bg-cyan-500/30 backdrop-blur-sm`}>
              <Scan className="h-3 w-3 mr-1" />{isScanning ? 'Stop Scan' : 'Scan'}
            </Button>
            {onSuitToggle && (
              <Button size="sm" onClick={onSuitToggle} className={`${suitMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'} border text-xs hover:bg-cyan-500/30 backdrop-blur-sm`}>
                <Shield className="h-3 w-3 mr-1" />{suitMode ? 'Suit On' : 'Suit Off'}
              </Button>
            )}
            {onGestureToggle && (
              <Button size="sm" onClick={onGestureToggle} className={`${gestureEnabled ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'} border text-xs hover:bg-cyan-500/30 backdrop-blur-sm`}>
                <Hand className="h-3 w-3 mr-1" />{gestureEnabled ? 'Gesture On' : 'Gesture Off'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HUDOverlay;
