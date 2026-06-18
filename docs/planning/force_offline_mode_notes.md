# Force Offline Mode — Viability & Implementation Notes

> **Status:** **Shipped v3.0.1** — Offline mode (cache-only) + server reachability probe.

## Product question

**Is there a functional difference between online and offline for transmutation?**

Once the app shell and a tool’s Wasm crate are cached, conversion is **identical**. Offline affects **what can be fetched**, not how the engine runs (NFR-1 unchanged).

## The “fire test” (realistic offline)

**Scenario:** Visit app → S5 download all engines → stop server / cut network → use tools.

| Step | `next dev` | `preview:cf` / production (SW on) |
|------|------------|-----------------------------------|
| Download S5 while server up | ✅ Wasm in Cache Storage | ✅ Same |
| Stop `npm run dev` | Server gone; **SW disabled** | N/A |
| **Reload page** | ❌ Browser: connection refused — **no app shell** | ✅ SW serves precached HTML/JS |
| **Keep tab open** (no reload) | ✅ Dot turns red; probe detects server down; **cached Wasm transmute works** | ✅ Same |
| Airplane mode | `navigator.onLine` false → offline UI | ✅ SW + cache |

**Important:** Stopping `npm run dev` does **not** set `navigator.onLine` to false. The app now detects **server unreachable** via a lightweight probe (`/manifest.webmanifest`, event-driven — not polling).

**Automatic offline UX** = UI reflects unreachable origin or no network. It is **not** the same as Settings **Offline mode** (voluntary cache-only while Wi‑Fi stays up).

### Recommended fire test procedure

```bash
cd frontend
npm run preview:cf
# Browser: open app → Settings → Download all tools (S5)
# Stop preview (Ctrl+C) OR enable airplane mode
# Reload → app should open from Service Worker; transmute with cached engines
```

## Implementation layers

### 1. Early bootstrap (`offline-bootstrap-script.ts`)

Inline script in `<head>` before React — installs fetch guard if `sessionStorage` Offline mode flag is set. Fixes first-navigation race with `useEffect`.

### 2. Fetch guard (`network-guard.ts`)

- Patches `window.fetch` for same-origin GET when Offline mode ON.
- Uses `__camaleonNativeFetch` shared with bootstrap.
- On native fetch failure (server down), dispatches `camaleon:server-unreachable`.

### 3. Service Worker (`sw.ts`, production only)

- `SET_FORCE_OFFLINE` message → cache-only fetch handler before Serwist.

### 4. Wasm gate (`load-glue.ts`)

- Refuses uncached `importWasmGlue` when Offline mode ON.

### 5. Server reachability (`server-reachability.ts`)

- Probes origin on mount, `focus`, `visibilitychange`, `online`.
- `online` (effective) = `networkOnline && serverReachable && !forceOffline`.

### 6. UI

- **Header:** minimal connectivity pip.
- **OfflineStatusNotice:** floating pill (top-right, below header) — no layout shift.
- **Settings:** fire test instructions.

## Why terminal still shows `GET 200` in dev

The Next.js **dev server log** is not the browser WAN. With simulation ON, uncached same-origin `fetch` from the **browser** should fail or hit Cache Storage — but full page loads and HMR still talk to localhost until the server stops.

## QA checklist

1. Simulation ON, no S5 → uncached tool fails (first try, no race).
2. Simulation ON, S5 12/12 → all tools transmute.
3. Dev running → stop dev → tab stays open → notice “Server unreachable”, cached transmute OK.
4. Dev stopped → **reload** → connection refused (expected without SW).
5. `preview:cf` + S5 → stop preview → **reload** → app opens, transmute works.
