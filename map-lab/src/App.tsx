import React, { useState, useRef, useCallback } from "react";
import { HexGrid } from "./render/HexGrid";
import { usePerfHUDHandle } from "./utils/perfMeter";
import { WorldConfig, Remix } from "./types";

export default function App() {
  console.log("Map Lab App rendering...");
  
  try {
    const perf = usePerfHUDHandle();
    const hexGridRef = useRef<{ resetView: () => void } | null>(null);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [keyVisible, setKeyVisible] = useState(true);
    
    const [config, setConfig] = useState<WorldConfig>({
      seed: 123,
      diameter: 100,
      noise: {
        plateCount: 3, // Much fewer plates for massive ocean areas
        warpAmp: 150, // Increased for more organic coastlines and wider ocean channels
        warpFreq: 0.004, // Much lower frequency for massive ocean features
        octaves: 5, // Increased for more detail
        lacunarity: 1.0, // Set to 1 as requested
        gain: 1.0, // Set to 1 as requested
        fbmWeight: 0.6, // Set to 0.6 as requested
        ridgedWeight: 0.3, // Reduced to allow more ocean space
        plateWeight: 0.15, // Much reduced for minimal continental boundaries
        seamWeight: 0.5, // Increased for massive water bodies and ocean channels
        depthWeight: 0.1, // Reduced to allow more ocean space
        seamDensity: 0.8 // Much higher density for massive ocean coverage
      },
      layers: 4, // Increased for more depth layers
      bands: [-0.95, -0.7, -0.2, 0.1, 0.4] // Much more ocean: ocean(-0.95), coast(-0.7), lowland(-0.2), highland(0.1), mountain(0.4)
    });

    const [remix, setRemix] = useState<Remix | undefined>(undefined);

    const resetView = useCallback(() => {
      // Call the resetView function on the HexGrid component
      if (hexGridRef.current) {
        hexGridRef.current.resetView();
      }
    }, []);

    const toggleControls = useCallback(() => {
      setControlsVisible(!controlsVisible);
    }, [controlsVisible]);

    console.log("App config state:", config);
    console.log("App rendering form with config:", config);

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Test div to verify rendering */}
        <div style={{ 
          backgroundColor: 'red', 
          color: 'white', 
          padding: '8px', 
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          🧪 FORM SHOULD BE VISIBLE BELOW - If you see this, the component is rendering
        </div>
        
        {/* Controls Toggle Button */}
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '8px',
          zIndex: 1001,
          pointerEvents: 'auto'
        }}>
          <button
            onClick={toggleControls}
            style={{
              padding: '8px 12px',
              backgroundColor: controlsVisible ? '#dc3545' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            {controlsVisible ? 'Hide Controls' : 'Show Controls'}
          </button>
        </div>
        
        {/* Map Lab Controls - Now positioned as overlay */}
        {controlsVisible && (
          <div style={{ 
            position: 'absolute',
            top: '60px', // Position below the test div
            left: '8px',
            right: '8px',
            padding: '16px', 
            borderBottom: '2px solid #007bff', 
            backgroundColor: '#ffffff',
            minHeight: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            border: '2px solid #007bff',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            pointerEvents: 'auto' // Ensure controls are interactive
          }}>
            <div style={{ 
              marginBottom: '16px', 
              fontSize: '14px', 
              color: '#333',
              lineHeight: '1.4',
              fontWeight: 'bold'
            }}>
              🗺️ <strong>Map Lab Controls:</strong> Create realistic continents and islands with oceans and lakes! 
              <br/>• <strong>Plate Count:</strong> Higher values create more continental fragments
              <br/>• <strong>Warp Amp/Freq:</strong> Control coastline organicness and continental shapes  
              <br/>• <strong>FBM/Ridged Weights:</strong> Balance between smooth terrain and mountain ranges
              <br/>• <strong>Plate Weight:</strong> Strength of continental plate boundaries
              <br/>• <strong>Seam Weight/Density:</strong> Coastline definition and water body shapes
              <br/>• <strong>Bands:</strong> Ocean (-0.8), Coast (-0.3), Lowland (0.1), Highland (0.4), Mountain (0.7)
              <br/>Use mouse wheel to zoom, drag to pan. Performance may degrade with diameters over 200.
            </div>
            
            {/* Test input to verify form rendering */}
            <div style={{ 
              marginBottom: '16px', 
              padding: '8px', 
              backgroundColor: '#e3f2fd', 
              border: '1px solid #2196f3',
              borderRadius: '4px'
            }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1976d2' }}>🧪 TEST INPUT:</label>
              <input 
                type="text" 
                value="This should be visible" 
                readOnly
                style={{ 
                  marginLeft: '8px', 
                  padding: '4px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  backgroundColor: '#fff'
                }}
              />
            </div>
            
            <div style={{ 
              display: 'grid', 
              gap: '12px', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              alignItems: 'end'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Seed:</label>
                <input 
                  type="number" 
                  min="0"
                  value={config.seed} 
                  onChange={(e) => setConfig({...config, seed: parseInt(e.target.value) || 0})}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Diameter:</label>
                <input 
                  type="number" 
                  min="10"
                  max="500"
                  value={config.diameter} 
                  onChange={(e) => setConfig({...config, diameter: Math.max(10, Math.min(500, parseInt(e.target.value) || 100))})}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Plate Count:</label>
                <input 
                  type="number" 
                  min="1"
                  max="20"
                  value={config.noise.plateCount} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, plateCount: Math.max(1, Math.min(20, parseInt(e.target.value) || 1))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Octaves:</label>
                <input 
                  type="number" 
                  min="1"
                  max="8"
                  value={config.noise.octaves} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, octaves: Math.max(1, Math.min(8, parseInt(e.target.value) || 1))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Warp Amp:</label>
                <input 
                  type="number" 
                  min="0"
                  max="200"
                  step="5"
                  value={config.noise.warpAmp} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, warpAmp: Math.max(0, Math.min(200, parseFloat(e.target.value) || 0))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Warp Freq:</label>
                <input 
                  type="number" 
                  step="0.001"
                  min="0"
                  max="0.1"
                  value={config.noise.warpFreq} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, warpFreq: Math.max(0, Math.min(0.1, parseFloat(e.target.value) || 0))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Lacunarity:</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="1.0"
                  max="4.0"
                  value={config.noise.lacunarity} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, lacunarity: Math.max(1.0, Math.min(4.0, parseFloat(e.target.value) || 1.0))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Gain:</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0.1"
                  max="1.0"
                  value={config.noise.gain} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, gain: Math.max(0.1, Math.min(1.0, parseFloat(e.target.value) || 0.5))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>FBM Weight:</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.noise.fbmWeight} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, fbmWeight: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.6))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Ridged Weight:</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.noise.ridgedWeight} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, ridgedWeight: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.3))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Plate Weight:</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.noise.plateWeight} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, plateWeight: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.1))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Seam Weight:</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="0.5"
                  value={config.noise.seamWeight} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, seamWeight: Math.max(0, Math.min(0.5, parseFloat(e.target.value) || 0.05))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Depth Weight:</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.noise.depthWeight} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, depthWeight: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.1))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Seam Density:</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.noise.seamDensity} 
                  onChange={(e) => setConfig({
                    ...config, 
                    noise: {...config.noise, seamDensity: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.3))}
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Layers:</label>
                <input 
                  type="number" 
                  min="1"
                  max="5"
                  value={config.layers} 
                  onChange={(e) => setConfig({
                    ...config, 
                    layers: Math.max(1, Math.min(5, parseInt(e.target.value) || 1))
                  })}
                  style={{ padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Reset View</label>
                <button 
                  onClick={resetView}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                >
                  Reset View
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Random Seed</label>
                <button 
                  onClick={() => setConfig({...config, seed: Math.floor(Math.random() * 10000)})}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e7e34'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                >
                  New World
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Map container - now takes full height since controls are overlay */}
        <div style={{ flex: 1, position: 'relative', minHeight: '400px', width: '100%' }}>
          <HexGrid cfg={config} remix={remix} perf={perf} ref={hexGridRef} />
        </div>

        {/* Terrain Key/Legend - positioned on the right side */}
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '8px',
          backgroundColor: '#ffffff',
          border: '2px solid #007bff',
          borderRadius: '8px',
          padding: '16px',
          minWidth: '200px',
          maxWidth: '250px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            borderBottom: '1px solid #e0e0e0',
            paddingBottom: '8px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#007bff'
            }}>
              🗺️ Terrain Key
            </div>
            <button
              onClick={() => setKeyVisible(!keyVisible)}
              style={{
                padding: '4px 8px',
                backgroundColor: keyVisible ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 'bold',
                minWidth: '60px'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              {keyVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {keyVisible && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#1e3a8a',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Deep Ocean (-0.9)</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#3b82f6',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Ocean (-0.5)</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#60a5fa',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Shallow Water (0.0)</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#93c5fd',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Beach/Sand (0.3)</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#fbbf24',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Lowland (0.6)</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#f59e0b',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Highland</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#dc2626',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>Mountains</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#7c2d12',
                    border: '1px solid #333',
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '12px', color: '#333' }}>High Mountains</span>
                </div>
              </div>
              
              <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#666',
                border: '1px solid #e9ecef'
              }}>
                <strong>Movement Values:</strong> Lower values = easier movement, Higher values = harder movement
              </div>
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("App rendering failed:", error);
    return <div style={{ padding: '20px', color: 'red' }}>Error rendering App: {error.message}</div>;
  }
}
