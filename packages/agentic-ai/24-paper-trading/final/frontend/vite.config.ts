import { defineConfig } from "vite";

// Vite's dev server passes /api requests on to port 8000 (the FastAPI app),
// so the browser sees one address and CORS never comes up.
export default defineConfig({
  server: { proxy: { "/api": "http://localhost:8000" } },
});
