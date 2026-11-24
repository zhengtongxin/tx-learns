// added: the whole "build" step. It copies src/ to dist/ (the folder deploy.sh uploads).
// The lesson's page is plain files, so no bundler is needed.
import { cpSync, rmSync } from "node:fs";

rmSync("dist", { recursive: true, force: true });
cpSync("src", "dist", { recursive: true });
console.log("built dist/");
