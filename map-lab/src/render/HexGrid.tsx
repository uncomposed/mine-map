import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import * as d3 from "d3";
import { Remix, WorldConfig } from "../types";
import { startWorker, type GenResponse } from "../workers/genWorker";
import { usePerfHUDHandle } from "../utils/perfMeter";
import { prioritizeChunks, visibleChunks } from "../world/chunkPlan";
import { axialToWorld, clamp, inRadius } from "../world/hexMath";
import { CHUNK_SIZE } from "../world/terrain";

type Props = { cfg: WorldConfig; remix?: Remix; perf: ReturnType<typeof usePerfHUDHandle> };

type HexGridRef = { resetView: () => void };

const TILE_RADIUS = 14;
const MAX_VISIBLE_REQUESTS = 72;
const MAX_RENDER_HEXES = 180_000;
const BG = "#f4f7f8";
const VIEWPORT_MARGIN = TILE_RADIUS * 2;

const LOCAL_TILE_OFFSETS = buildLocalTileOffsets();
const HEX_CORNERS = buildHexCorners(TILE_RADIUS);
const COLOR_BINS = buildColorBins(32);

export const HexGrid = forwardRef<HexGridRef, Props>(({ cfg, remix, perf }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const viewRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const worker = useMemo(() => startWorker(), []);
  const storeRef = useRef(new Map<string, GenResponse>());
  const inFlightRef = useRef(new Set<string>());
  const generationRef = useRef(0);

  const drawFnRef = useRef<() => void>(() => {});
  const loadFnRef = useRef<() => void>(() => {});
  const drawQueuedRef = useRef(false);
  const loadQueuedRef = useRef(false);

  const makeChunkKey = useCallback((generation: number, cq: number, cr: number) => {
    return `${generation}:${cq}:${cr}`;
  }, []);

  const requestVisibleChunks = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width <= 0 || height <= 0) return;

    const generation = generationRef.current;
    const allVisible = visibleChunks(viewRef.current, width, height, TILE_RADIUS, CHUNK_SIZE);
    perf.setVisibleChunks(allVisible.length);

    const prioritized = prioritizeChunks(
      allVisible,
      viewRef.current,
      width,
      height,
      TILE_RADIUS,
      CHUNK_SIZE,
      MAX_VISIBLE_REQUESTS,
    );

    for (const c of prioritized) {
      const key = makeChunkKey(generation, c.cq, c.cr);
      if (storeRef.current.has(key) || inFlightRef.current.has(key)) continue;

      inFlightRef.current.add(key);
      worker
        .request({ cfg, remix, chunk: c, layer: 0 })
        .then((res) => {
          inFlightRef.current.delete(key);
          if (generationRef.current !== generation) return;
          storeRef.current.set(key, res);
          drawFnRef.current();
        })
        .catch(() => {
          inFlightRef.current.delete(key);
        });
    }
  }, [cfg, makeChunkKey, perf, remix, worker]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);

    const pixelWidth = Math.floor(width * dpr);
    const pixelHeight = Math.floor(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const t = viewRef.current;
    ctx.setTransform(t.k * dpr, 0, 0, t.k * dpr, t.x * dpr, t.y * dpr);

    const worldX0 = -t.x / t.k - VIEWPORT_MARGIN;
    const worldY0 = -t.y / t.k - VIEWPORT_MARGIN;
    const worldX1 = worldX0 + width / t.k + VIEWPORT_MARGIN * 2;
    const worldY1 = worldY0 + height / t.k + VIEWPORT_MARGIN * 2;

    const generation = generationRef.current;
    const chunks = visibleChunks(t, width, height, TILE_RADIUS, CHUNK_SIZE);
    const paths = Array.from({ length: COLOR_BINS.length }, () => new Path2D());

    let drawnHexes = 0;
    const diameterRadius = cfg.diameter * 0.5;

    for (const chunk of chunks) {
      const res = storeRef.current.get(makeChunkKey(generation, chunk.cq, chunk.cr));
      if (!res) continue;

      const baseQ = chunk.cq * CHUNK_SIZE;
      const baseR = chunk.cr * CHUNK_SIZE;

      for (let i = 0; i < res.size; i++) {
        if (drawnHexes >= MAX_RENDER_HEXES) break;

        const local = LOCAL_TILE_OFFSETS[i];
        const q = baseQ + local.q;
        const r = baseR + local.r;
        if (!inRadius(q, r, diameterRadius)) continue;

        const world = axialToWorld(q, r, TILE_RADIUS);
        if (world.x < worldX0 || world.x > worldX1 || world.y < worldY0 || world.y > worldY1) continue;

        const normalized = clamp((res.movement[i] + 1) * 0.5, 0, 1);
        const idx = Math.min(COLOR_BINS.length - 1, Math.floor(normalized * COLOR_BINS.length));
        appendHexToPath(paths[idx], world.x, world.y);
        drawnHexes++;
      }
    }

    for (let i = 0; i < COLOR_BINS.length; i++) {
      ctx.fillStyle = COLOR_BINS[i];
      ctx.fill(paths[i]);
    }

    perf.setVisibleHexes(drawnHexes);
  }, [cfg.diameter, makeChunkKey, perf]);

  drawFnRef.current = () => {
    if (drawQueuedRef.current) return;
    drawQueuedRef.current = true;
    requestAnimationFrame(() => {
      drawQueuedRef.current = false;
      draw();
    });
  };

  loadFnRef.current = () => {
    if (loadQueuedRef.current) return;
    loadQueuedRef.current = true;
    requestAnimationFrame(() => {
      loadQueuedRef.current = false;
      requestVisibleChunks();
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.18, 10])
      .translateExtent([
        [-2_000_000, -2_000_000],
        [2_000_000, 2_000_000],
      ])
      .on("zoom", (event) => {
        viewRef.current = event.transform;
        drawFnRef.current();
        loadFnRef.current();
      });

    zoomRef.current = zoom;

    const sel = d3.select(canvas);
    sel.call(zoom as unknown as (selection: d3.Selection<HTMLCanvasElement, unknown, null, undefined>) => void);
    sel.on("dblclick.zoom", null);

    const centerTransform = d3.zoomIdentity.translate(canvas.clientWidth * 0.5, canvas.clientHeight * 0.5).scale(1);
    viewRef.current = centerTransform;
    sel.call(zoom.transform as unknown as any, centerTransform);

    const resizeObserver = new ResizeObserver(() => {
      drawFnRef.current();
      loadFnRef.current();
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      sel.on(".zoom", null);
    };
  }, []);

  useEffect(() => {
    generationRef.current += 1;
    storeRef.current.clear();
    inFlightRef.current.clear();
    drawFnRef.current();
    loadFnRef.current();
  }, [cfg, remix]);

  useImperativeHandle(
    ref,
    () => ({
      resetView() {
        const canvas = canvasRef.current;
        const zoom = zoomRef.current;
        if (!canvas || !zoom) return;

        const centered = d3.zoomIdentity.translate(canvas.clientWidth * 0.5, canvas.clientHeight * 0.5).scale(1);
        viewRef.current = centered;
        d3.select(canvas).transition().duration(180).call(zoom.transform as unknown as any, centered);
      },
    }),
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", touchAction: "none", cursor: "grab" }}
    />
  );
});

function buildLocalTileOffsets() {
  return Array.from({ length: CHUNK_SIZE * CHUNK_SIZE }, (_, i) => ({
    q: i % CHUNK_SIZE,
    r: Math.floor(i / CHUNK_SIZE),
  }));
}

function buildHexCorners(radius: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius] as const;
  });
}

function appendHexToPath(path: Path2D, x: number, y: number) {
  path.moveTo(x + HEX_CORNERS[0][0], y + HEX_CORNERS[0][1]);
  for (let i = 1; i < HEX_CORNERS.length; i++) {
    path.lineTo(x + HEX_CORNERS[i][0], y + HEX_CORNERS[i][1]);
  }
  path.closePath();
}

function buildColorBins(count: number) {
  const stops = [
    { at: 0.0, hex: "#0b1f3a" },
    { at: 0.22, hex: "#2166ac" },
    { at: 0.44, hex: "#67a9cf" },
    { at: 0.58, hex: "#f7f7bf" },
    { at: 0.72, hex: "#5aae61" },
    { at: 0.86, hex: "#a6761d" },
    { at: 1.0, hex: "#6b3d2e" },
  ];

  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    out.push(interpolateStops(stops, t));
  }
  return out;
}

function interpolateStops(stops: Array<{ at: number; hex: string }>, t: number) {
  if (t <= stops[0].at) return stops[0].hex;
  if (t >= stops[stops.length - 1].at) return stops[stops.length - 1].hex;

  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].at) {
      const a = stops[i - 1];
      const b = stops[i];
      const lt = (t - a.at) / (b.at - a.at);
      return lerpHex(a.hex, b.hex, lt);
    }
  }

  return stops[stops.length - 1].hex;
}

function lerpHex(a: string, b: string, t: number) {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);

  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);

  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);

  return `#${toHex(rr)}${toHex(rg)}${toHex(rb)}`;
}

function toHex(v: number) {
  return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
}
