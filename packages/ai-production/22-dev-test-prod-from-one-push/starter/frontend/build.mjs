// The whole "build" step: copy src/ to dist/ (the folder deploy.sh uploads).
import { cpSync, rmSync } from "node:fs";

// TODO: remove dist/ if it exists, then copy src/ to dist/ (recursive).
// Hint: rmSync("dist", { recursive: true, force: true }) and cpSync("src", "dist", { recursive: true })
console.log("TODO: build step not written yet");
process.exit(1);
