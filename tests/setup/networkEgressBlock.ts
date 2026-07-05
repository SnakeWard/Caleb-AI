import net from "node:net";
import tls from "node:tls";

// H5 — Network Egress Proof. This setup file makes the default test
// environment structurally hostile to network attempts: after M1/G1 the
// codebase legitimately contains fetch capability in exactly two gated
// adapters, so "offline by default" must be enforced behaviorally, not
// reported. See docs/NETWORK_EGRESS_PROOF.md.
//
// Stand-down rule: the traps arm in every default run. They stand down only
// under CALEB_LIVE_TEST=1 — the same explicit opt-in that already gates
// *.live.test.ts execution. This env read happens once, at load time, before
// the credential-read trap is installed.

export const NETWORK_EGRESS_BLOCKED = "NETWORK_EGRESS_BLOCKED_BY_H5";
export const CREDENTIAL_READ_BLOCKED = "CREDENTIAL_ENV_READ_BLOCKED_BY_H5";

// Exact names only. Pattern matching would false-positive on deliberately
// unset test variables (e.g. CALEB_TEST_LIVE_KEY_INTENTIONALLY_UNSET).
export const CREDENTIAL_ENV_DENYLIST: readonly string[] = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "XAI_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "GOOGLE_API_KEY",
  "AWS_SECRET_ACCESS_KEY"
];

const LIVE_MODE = process.env.CALEB_LIVE_TEST === "1";

if (!LIVE_MODE) {
  // Trap 1: global fetch — the only sanctioned egress mechanism in src/.
  globalThis.fetch = ((..._args: unknown[]) => {
    throw new Error(`${NETWORK_EGRESS_BLOCKED}: fetch attempted in a default test run`);
  }) as unknown as typeof fetch;

  // Trap 2: low-level sockets — closes the node:net / node:http path.
  (net.Socket.prototype as unknown as { connect: unknown }).connect = function connectBlocked(): never {
    throw new Error(`${NETWORK_EGRESS_BLOCKED}: net.Socket.connect attempted in a default test run`);
  };

  // Trap 3: TLS convenience entry point.
  (tls as unknown as { connect: unknown }).connect = function tlsConnectBlocked(): never {
    throw new Error(`${NETWORK_EGRESS_BLOCKED}: tls.connect attempted in a default test run`);
  };

  // Trap 4: credential env reads. Only value READS of denylisted names throw;
  // all other env access (reads, writes, deletes, `in` checks) passes through.
  const realEnv = process.env;
  const proxiedEnv = new Proxy(realEnv, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && CREDENTIAL_ENV_DENYLIST.includes(prop)) {
        throw new Error(`${CREDENTIAL_READ_BLOCKED}: ${prop} read in a default test run`);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  Object.defineProperty(process, "env", { value: proxiedEnv, configurable: true });
}
