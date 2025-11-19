  # Interactive ESM

  Interactive ESM is a small demo app that renders an interactive seating map using React + TypeScript + Vite.

  Key features
  - Interactive SVG seating map with pan & zoom
  - Keyboard navigation (tab, arrows), Enter/Space to select
  - Selection persistence in `localStorage`
  - Visual modes: heat map and dark mode
  - Max 8 seats can be selected; reserved/held/sold seats are not selectable

  Quick start

  Prerequisites:
  - Node.js 18+ (or compatible)
  - `pnpm` (recommended) or `npm`

  Install dependencies:

  ```bash
  pnpm install
  ```

  Start dev server:

  ```bash
  pnpm dev
  ```

  Open http://localhost:5173 in your browser.

  Build for production:

  ```bash
  pnpm build
  ```

  Preview the production build locally:

  ```bash
  pnpm preview
  ```

  End-to-end tests (Playwright)

  This project includes Playwright tests under `tests/e2e`.

  Run the tests (ensure dev server is running in another terminal):

  ```bash
  pnpm dev          # run app
  pnpm test:e2e     # run playwright tests
  ```

  Useful scripts
  - `pnpm dev` — start Vite dev server
  - `pnpm build` — build production bundle
  - `pnpm preview` — preview production bundle
  - `pnpm test:e2e` — run Playwright E2E tests

  Project notes
  - Seat selections persist in `localStorage` under the key `selected-seats`.
  - The seating map data is loaded from `public/venue.json`.
  - If tests fail related to keyboard focus on SVG circles, run tests headed/with `--debug` and verify the browser supports focusing SVG elements; some test environments may need additional focus handling.

  License

  This repository contains example/demo code — update or add a license as needed.
