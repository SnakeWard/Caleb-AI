import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { projectInfo } from "./project/projectInfo.js";

export { projectInfo };
export * from "./types/index.js";
export * from "./hollows/index.js";
export * from "./verification/index.js";
export * from "./ledger/index.js";
export * from "./changeGuard/index.js";
export * from "./reports/index.js";
export * from "./cli/index.js";
export * from "./hollowcut/index.js";
export * from "./logicEngine/index.js";
export * from "./storage/index.js";
export * from "./modelBoundary/index.js";
export * from "./finalAssembly/index.js";
export * from "./providers/index.js";
export * from "./rawOutput/index.js";

export const startupMessage = `${projectInfo.name}: ${projectInfo.doctrine} (${projectInfo.currentPhase})`;

const isEntryPoint =
  typeof process.argv[1] === "string" &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntryPoint) {
  console.log(startupMessage);
}
