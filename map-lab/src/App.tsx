import React, { useMemo, useRef, useState } from "react";
import { HexGrid } from "./render/HexGrid";
import { usePerfHUDHandle } from "./utils/perfMeter";
import { WorldConfig } from "./types";

const INITIAL_CONFIG: WorldConfig = {
  seed: 123,
  diameter: 160,
  noise: {
    plateCount: 7,
    warpAmp: 90,
    warpFreq: 0.007,
    octaves: 5,
    lacunarity: 2,
    gain: 0.52,
    fbmWeight: 0.7,
    ridgedWeight: 0.35,
    plateWeight: 0.5,
    seamWeight: 0.18,
    depthWeight: 0.15,
    seamDensity: 0.5,
  },
  layers: 4,
  bands: [],
};

export default function App() {
  const perf = usePerfHUDHandle();
  const gridRef = useRef<{ resetView: () => void } | null>(null);
  const [cfg, setCfg] = useState<WorldConfig>(INITIAL_CONFIG);
  const [controlsOpen, setControlsOpen] = useState(true);

  const perfLabel = useMemo(() => {
    return `${perf.fps.toFixed(0)} FPS · ${perf.visibleHexes.toLocaleString()} hexes · ${perf.visibleChunks} chunks`;
  }, [perf.fps, perf.visibleChunks, perf.visibleHexes]);

  return (
    <div style={{ height: "100vh", background: "#0f1418", color: "#e8edf1", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <header
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #24313b",
          background: "#101920",
        }}
      >
        <div style={{ fontWeight: 600 }}>Map Lab</div>
        <div style={{ fontSize: 12, color: "#9fb0be" }}>{perfLabel}</div>
      </header>

      <div style={{ position: "relative", minHeight: 0 }}>
        <HexGrid cfg={cfg} perf={perf} ref={gridRef} />

        <aside
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: controlsOpen ? 320 : 148,
            background: "rgba(16, 25, 32, 0.94)",
            border: "1px solid #2a3c48",
            borderRadius: 10,
            padding: 12,
            backdropFilter: "blur(2px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <strong style={{ fontSize: 14 }}>Generation</strong>
            <button style={buttonStyle} onClick={() => setControlsOpen((x) => !x)}>
              {controlsOpen ? "Collapse" : "Expand"}
            </button>
          </div>

          {controlsOpen && (
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Seed">
                <input
                  style={inputStyle}
                  type="number"
                  value={cfg.seed}
                  onChange={(e) => setCfg({ ...cfg, seed: Number(e.target.value) || 0 })}
                />
              </Field>

              <Field label={`Diameter (${cfg.diameter})`}>
                <input
                  type="range"
                  min={40}
                  max={700}
                  value={cfg.diameter}
                  onChange={(e) => setCfg({ ...cfg, diameter: Number(e.target.value) })}
                />
              </Field>

              <Field label={`Plate Count (${cfg.noise.plateCount})`}>
                <input
                  type="range"
                  min={2}
                  max={18}
                  value={cfg.noise.plateCount}
                  onChange={(e) => setCfg({ ...cfg, noise: { ...cfg.noise, plateCount: Number(e.target.value) } })}
                />
              </Field>

              <Field label={`Warp Amp (${cfg.noise.warpAmp})`}>
                <input
                  type="range"
                  min={10}
                  max={180}
                  value={cfg.noise.warpAmp}
                  onChange={(e) => setCfg({ ...cfg, noise: { ...cfg.noise, warpAmp: Number(e.target.value) } })}
                />
              </Field>

              <Field label={`Seam Density (${cfg.noise.seamDensity.toFixed(2)})`}>
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.01}
                  value={cfg.noise.seamDensity}
                  onChange={(e) => setCfg({ ...cfg, noise: { ...cfg.noise, seamDensity: Number(e.target.value) } })}
                />
              </Field>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button style={buttonStyle} onClick={() => setCfg({ ...cfg, seed: Math.floor(Math.random() * 1_000_000) })}>
                  New Seed
                </button>
                <button style={buttonStyle} onClick={() => gridRef.current?.resetView()}>
                  Reset View
                </button>
                <button style={buttonStyle} onClick={() => setCfg(INITIAL_CONFIG)}>
                  Defaults
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#afc0cf" }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const buttonStyle: React.CSSProperties = {
  border: "1px solid #355061",
  background: "#182833",
  color: "#dce8f0",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 12,
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #355061",
  background: "#12202a",
  color: "#dce8f0",
  borderRadius: 6,
  padding: "6px 8px",
};
