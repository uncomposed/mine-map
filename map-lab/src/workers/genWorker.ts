import { WorldConfig, Remix } from "../types";

export type GenRequest = {
  cfg: WorldConfig;
  remix?: Remix;
  chunk: { cq: number; cr: number };
  layer: number;
};
export type GenResponse = {
  cq: number;
  cr: number;
  size: number;
  movement: Int8Array;
};

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number,(r:GenResponse)=>void>();

export function startWorker() {
  if (!worker) {
    worker = new Worker(new URL("./genWorkerImpl.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent) => {
      const { id, res } = e.data;
      const cb = pending.get(id);
      if (cb) { pending.delete(id); cb(res as GenResponse); }
    };
  }
  return {
    request(req: GenRequest): Promise<GenResponse> {
      const id = ++seq;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        worker!.postMessage({ id, req });
      });
    }
  };
}
