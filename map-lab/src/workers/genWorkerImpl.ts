import { createTerrainContext, generateChunkData, terrainContextKey, TerrainContext } from "../world/terrain";
import { Remix, WorldConfig } from "../types";

const contextCache = new Map<string, TerrainContext>();

self.onmessage = (e: MessageEvent) => {
  const { id, req } = e.data as {
    id: number;
    req: { cfg: WorldConfig; remix?: Remix; chunk: { cq: number; cr: number }; layer: number };
  };

  const cacheKey = terrainContextKey(req.cfg, req.remix);
  let ctx = contextCache.get(cacheKey);
  if (!ctx) {
    ctx = createTerrainContext(req.cfg, req.remix);
    contextCache.set(cacheKey, ctx);

    // Keep cache bounded when users iterate aggressively.
    if (contextCache.size > 8) {
      const first = contextCache.keys().next().value;
      if (first) contextCache.delete(first);
    }
  }

  const res = generateChunkData(req, ctx);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage({ id, res }, [res.movement.buffer]);
};
