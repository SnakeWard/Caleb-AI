#!/usr/bin/env node
export * from "./cliTypes.js";
export * from "./cliErrors.js";
export * from "./commandParser.js";
export * from "./commandHandlers.js";
export * from "./minimalCli.js";

import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { runMinimalCli } from "./minimalCli.js";

const isEntryPoint =
  typeof process.argv[1] === "string" &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntryPoint) {
  runMinimalCli(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unexpected CLI failure.";
      process.stderr.write(`ERROR\nCommand: minimal-cli\n${message.slice(0, 500)}\n`);
      process.exitCode = 1;
    });
}
