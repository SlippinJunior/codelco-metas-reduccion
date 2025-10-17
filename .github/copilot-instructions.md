Repo: codelco-metas-reduccion — Copilot / AI agent instructions

Use these notes to be immediately productive in this repository. Keep guidance concise and concrete — reference files shown as examples.

1) Big-picture architecture
- Frontend-only React prototype (Vite + React 18). No backend included; many services simulate a backend using localStorage and JSON fixtures in `data/`.
- Primary UI folders: `src/components/` (reusable UI pieces) and `src/pages/` (routes/views). Examples: `src/pages/Dashboard.jsx`, `src/components/PanelMetas.jsx`.
- Domain services live in `src/services/` and encapsulate data flows and business rules. They are the de-facto API boundary:
  - `servicioMetas.js` — CRUD + validation + CSV export for "metas" using `localStorage` and `data/metas-ejemplo.json`.
  - `servicioAuditoria.js` — audit events stored in `localStorage` and export logic.
  - Other services (sensores, verificacion, anomalias) follow the same pattern.
- Tests live under `src/__tests__/` and use Jest + Testing Library; service modules are commonly mocked in tests (`jest.mock('../services/servicioMetas')`).

2) Why code is organized this way (intent)
- This is an academic prototype meant to demonstrate front-end flows (forms, filters, charts, CSV export, mock audit trail) without a real backend. Keep changes consistent with that goal: prefer lightweight, client-side implementations unless adding a true integration.

3) Developer workflows — build, run, test, debug (concrete)
- Install & dev server:
  - npm install
  - npm run dev (Vite serves at port 3000 — see `vite.config.js`)
- Build / preview:
  - npm run build
  - npm run preview
- Tests:
  - npm test  (runs `jest --runInBand` as defined in `package.json`)
  - Tests rely on `src/setupTests.js` to polyfill `localStorage`, `crypto.subtle` digest polyfill, and mocks for URL.createObjectURL.
- Debugging tips:
  - Services use `localStorage` keys: `codelco_metas_reduccion` (metas) and `codelco_auditoria_events` (auditoría). Inspect/seed those during manual testing.
  - Vite config contains a dev proxy for `/api` -> `http://localhost:5000`. If you implement a backend, keep this proxy or update it.

4) Project-specific conventions & patterns (concrete)
- Storage-as-API pattern: services expose async functions that act like HTTP APIs but read/write `localStorage` and JSON fixtures (`data/*.json`). When converting to a real API, replace localStorage calls with fetch/axios; keep function signatures.
- Naming: services prefixed with `servicio` (Spanish). Domain entities: `metas`, `auditoria`, `sensores`, `verificacion`.
- Validation: `src/services/servicioMetas.js` exports `validadores` with `validarMeta(metaData)` used by `FormularioMeta.jsx`. Tests mock the `validadores` object to control validation outcomes.
- Tests & mocks:
  - Service modules are mocked with jest.mock('...') and tests override exported functions/objects (see `src/__tests__/FormularioMeta.test.jsx`). Follow same pattern for new services.
  - `src/setupTests.js` creates global mocks for `localStorage`, `fetch`, and crypto digest — do not duplicate these mocks in individual tests unless overriding behavior.
- Exports: Most services export both named functions and default objects (e.g., `export default { listarEventos, agregarEvento }`). Tests sometimes import the module as `* as servicioMetas` to override specific exports.

5) Integration points and external dependencies
- Frontend-only dependencies listed in `package.json` — no server runtime in repo. If adding a backend, respect Vite proxy in `vite.config.js` or update it.
- Data fixtures: `data/*.json` contain example payloads used by services and by tests/mocks (e.g., `data/metas-ejemplo.json`, `data/auditoria-ejemplo.json`). Use these to craft test fixtures.
- CSV & file-download logic: services create Blob objects and use `URL.createObjectURL`. The test environment already mocks `createObjectURL` in `src/setupTests.js`.

6) Code examples to follow
- To add a new domain service (example: `servicioNovedades.js`):
  - Mirror `servicioMetas.js` structure: init from `data/` fixture, expose async functions returning { success, data, message } and keep non-blocking audit calls where appropriate.
  - Export a `validadores` object if input validation is required.
- To mock a service in tests:
  - jest.mock('../services/servicioX');
  - In beforeEach: jest.clearAllMocks(); override specific exports: `servicioX.funcion = jest.fn().mockResolvedValue(...)` or `servicioX.validadores = { validar: jest.fn().mockReturnValue(...) }`.
- To seed localStorage for manual dev or storybook-like scenarios: paste JSON into browser console: `localStorage.setItem('codelco_metas_reduccion', JSON.stringify(<fixture>))`.

7) Small gotchas / notes
- Dates: code uses ISO strings for storage and compares by constructing `new Date(...)`. Keep timezone-awareness in mind when writing tests — tests often compare string fields or use `toLocaleDateString('es-CL')` in CSV outputs.
- IDs: services generate IDs like `meta-${Date.now()}-${Math.random().toString(36).substr(2,9)}`; tests may assert `expect.objectContaining({ id: 'test-meta-id' })` when mocking create calls — prefer mocking `crearMeta` rather than relying on generated IDs.
- Global mocks in `src/setupTests.js` will affect all tests. If a test needs a real localStorage implementation (rare), explicitly restore it and restore after the test.

8) What to update if you change structure
- If you replace localStorage with a real HTTP backend, update:
  - `src/services/*` to use fetch/axios while preserving function signatures.
  - `vite.config.js` proxy target if backend runs on a different port.
  - Tests: remove or adapt mocks expecting localStorage behavior; prefer mocking network calls using `jest.spyOn(global, 'fetch')` or MSW.

9) Where to look for examples (paths)
- Main entry: `src/main.jsx`
- Services: `src/services/servicioMetas.js`, `src/services/servicioAuditoria.js`
- Tests: `src/__tests__/FormularioMeta.test.jsx`, `src/__tests__/PanelMetas.test.jsx`
- Fixtures: `data/metas-ejemplo.json`, `data/auditoria-ejemplo.json`
- Test setup: `src/setupTests.js`

If any section is unclear or you'd like additional examples (e.g., how to migrate a specific service to HTTP or add MSW for network-level tests), tell me which area to expand and I will iterate.
