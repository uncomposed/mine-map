import React, { useEffect, useMemo, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import * as d3 from "d3";
import { WorldConfig, Remix } from "../types";
import { startWorker, type GenResponse } from "../workers/genWorker";
import { usePerfHUDHandle } from "../utils/perfMeter";

type Props = { cfg: WorldConfig; remix?: Remix; perf: ReturnType<typeof usePerfHUDHandle> };

type Axial = { q: number; r: number };
type ChunkCoord = { cq: number; cr: number };
const CHUNK = 64;

function axialToWorld(q: number, r: number, R: number) {
  const x = Math.sqrt(3) * (q + r / 2) * R;
  const y = (3 / 2) * r * R;
  return { x, y };
}

function hexPath(cx: number, cy: number, R: number) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  return "M" + pts.map((p) => p.join(",")).join("L") + "Z";
}

function visibleChunks(view: d3.ZoomTransform, width: number, height: number, R: number): ChunkCoord[] {
  const pad = 2 * R;
  const x0 = -view.x / view.k - pad;
  const y0 = -view.y / view.k - pad;
  const x1 = x0 + width / view.k + 2 * pad;
  const y1 = y0 + height / view.k + 2 * pad;
  const s = CHUNK * Math.sqrt(3) * R;
  const t = CHUNK * 1.5 * R;
  const cq0 = Math.floor(x0 / s) - 1, cq1 = Math.floor(x1 / s) + 1;
  const cr0 = Math.floor(y0 / t) - 1, cr1 = Math.floor(y1 / t) + 1;
  const out: ChunkCoord[] = [];
  for (let cr = cr0; cr <= cr1; cr++) for (let cq = cq0; cq <= cq1; cq++) out.push({ cq, cr });
  return out;
}

function palette() {
  return [
    "#1e3a8a", // Deep ocean blue
    "#3b82f6", // Ocean blue
    "#60a5fa", // Shallow water/coastal
    "#93c5fd", // Beach/sand
    "#fbbf24", // Lowland/plains
    "#f59e0b", // Highland/hills
    "#dc2626", // Mountains
    "#7c2d12"  // High mountains
  ];
}

export const HexGrid = forwardRef<{ resetView: () => void }, Props>(({ cfg, remix, perf }, ref) => {
  console.log("HexGrid rendering with:", { cfg, remix, perf });
  
  try {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const gRef = useRef<SVGGElement | null>(null);
    const [view, setView] = useState<d3.ZoomTransform>(d3.zoomIdentity);
    const [store] = useState(()=>new Map<string, GenResponse>());
    const worker = useMemo(()=>startWorker(),[]);
    const R = 14;

    console.log("HexGrid state initialized");

    // Calculate dynamic viewBox based on diameter
    const worldRadius = (cfg.diameter / 2) * R * 1.5; // Add some padding
    const viewBox = [-worldRadius, -worldRadius, worldRadius * 2, worldRadius * 2].join(" ");

    // Performance warning
    const isHighDiameter = cfg.diameter > 200;
    const performanceWarning = isHighDiameter ? 
      `⚠️ High diameter (${cfg.diameter}) may cause performance issues. Consider reducing to 200 or less for smooth interaction.` : null;

    // Reset view function
    const resetView = useCallback(() => {
      if (!svgRef.current || !gRef.current) return;
      
      const svg = d3.select(svgRef.current);
      const g = d3.select(gRef.current);
      
      // Reset to identity transform
      const resetTransform = d3.zoomIdentity;
      setView(resetTransform);
      g.attr("transform", resetTransform.toString());
      
      // Reset the zoom behavior
      svg.transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        resetTransform
      );
    }, []);

    // Expose resetView function to parent component
    useImperativeHandle(ref, () => ({
      resetView
    }), [resetView]);

    // Create zoom behavior with useCallback to prevent recreation
    const createZoomBehavior = useCallback(() => {
      console.log("Creating zoom behavior");
      return d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .translateExtent([[-worldRadius * 2, -worldRadius * 2], [worldRadius * 2, worldRadius * 2]])
        .on("start", () => {
          console.log("Zoom started");
          if (svgRef.current) {
            d3.select(svgRef.current).style("cursor", "grabbing");
          }
        })
        .on("zoom", (event) => {
          console.log("Zoom event triggered:", event.transform);
          const { transform } = event;
          
          // Apply transform to the group element immediately
          if (gRef.current) {
            d3.select(gRef.current).attr("transform", transform.toString());
            console.log("Applied transform to group:", transform.toString());
          }
          
          // Update the view state
          setView(transform);
        })
        .on("end", () => {
          console.log("Zoom ended, final transform:", view.toString());
          if (svgRef.current) {
            d3.select(svgRef.current).style("cursor", "grab");
          }
        });
    }, [worldRadius]); // Removed view dependency to prevent infinite loops

    useEffect(() => {
      console.log("HexGrid useEffect 1 - setting up zoom");
      
      if (!svgRef.current || !gRef.current) {
        console.log("SVG or group ref not ready yet");
        return;
      }
      
      const svg = d3.select(svgRef.current);
      const g = d3.select(gRef.current);
      
      console.log("Setting up zoom behavior on SVG element");
      
      // Create and apply zoom behavior
      const zoom = createZoomBehavior();
      
      // Set the initial transform if we have a view state
      if (view.k !== 1 || view.x !== 0 || view.y !== 0) {
        g.attr("transform", view.toString());
        svg.call(zoom.transform as any, view);
      }
      
      svg.call(zoom as any);
      console.log("Zoom behavior applied to SVG");
      
      // Disable double-click zoom
      svg.on("dblclick.zoom", null);
      
      // Ensure proper event handling
      svg.style("touch-action", "none");
      
      // Cleanup function
      return () => {
        console.log("Cleaning up zoom behavior");
        svg.on(".zoom", null);
        svg.style("touch-action", "auto");
      };
    }, [cfg.diameter, worldRadius, createZoomBehavior, view]);

    useEffect(() => {
      console.log("HexGrid useEffect 2 - clearing store");
      store.clear();
    }, [cfg.seed, cfg.diameter, cfg.noise, cfg.layers, cfg.bands, remix?.id]);

    useEffect(() => {
      console.log("HexGrid useEffect 3 - processing chunks");
      const svg = d3.select(svgRef.current!);
      const width = svg.node()!.clientWidth;
      const height = svg.node()!.clientHeight;
      const chunks = visibleChunks(view, width, height, R);
      perf.setVisibleChunks(chunks.length);

      // Limit the number of chunks to process for performance
      const maxChunks = Math.min(chunks.length, 25); // Limit to 25 chunks max
      const limitedChunks = chunks.slice(0, maxChunks);

      const promises: Promise<void>[] = [];
      for (const c of limitedChunks) {
        const key = `${cfg.seed}:${cfg.diameter}:${remix?.id||"base"}:${c.cq}:${c.cr}`;
        if (store.has(key)) continue;
        const req = { cfg, remix, chunk: c, layer: 0 };
        const p = worker.request(req).then((res) => { store.set(key, res); });
        promises.push(p);
      }

      Promise.all(promises).then(() => {
        const g = d3.select(gRef.current!);
        const pal = palette();
        const entries = Array.from(store.values());
        let count = 0;

        // Limit the number of hexes to render for performance
        const maxHexes = 10000; // Limit to 10k hexes max
        let hexCount = 0;

        const sels = g.selectAll("path.hex").data(entries.flatMap((res) => {
          const { cq, cr, movement, size } = res;
          const items: { d: string; fill: string }[] = [];
          for (let i = 0; i < size && hexCount < maxHexes; i++) {
            const q = i % CHUNK + cq * CHUNK;
            const r = Math.floor(i / CHUNK) + cr * CHUNK;
            if (!inRadius(q, r, cfg.diameter/2)) continue;
            const aw = axialToWorld(q, r, R);
            const band = movement[i];
            const idx = Math.max(0, Math.min(pal.length-1, bandToIndex(band, cfg.bands)));
            items.push({ d: hexPath(aw.x, aw.y, R), fill: pal[idx] });
            count++;
            hexCount++;
          }
          return items;
        }), (_, i)=>String(i));

        sels.enter().append("path")
          .attr("class","hex")
          .attr("vector-effect","non-scaling-stroke")
          .attr("stroke","#555")
          .attr("stroke-width","0.75")
          .attr("fill", d=>d.fill)
          .attr("d", d=>d.d);

        sels.attr("fill", d=>d.fill).attr("d", d=>d.d);
        sels.exit().remove();

        perf.setVisibleHexes(count);
      });

    }, [view, cfg, remix]);

    const width = "100%";
    const height = "100%";

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {performanceWarning && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#856404',
            zIndex: 1000,
            maxWidth: '300px'
          }}>
            {performanceWarning}
          </div>
        )}
        <svg 
          ref={svgRef} 
          viewBox={viewBox} 
          style={{ 
            width: '100%', 
            height: '100%', 
            background: "white",
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none',
            overflow: 'visible'
          }} 
          shapeRendering="geometricPrecision"
        >
          <g ref={gRef} />
        </svg>
      </div>
    );
  } catch (error) {
    console.error("HexGrid rendering failed:", error);
    return <div>Error rendering HexGrid</div>;
  }
});

function inRadius(q: number, r: number, radius: number) {
  const s = -q - r;
  return Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= radius;
}

function bandToIndex(v: number, bands: number[]) {
  let idx = 0;
  for (let i=0;i<bands.length;i++) if (v > bands[i]) idx = i+1;
  return idx;
}
