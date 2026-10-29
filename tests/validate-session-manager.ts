import { strict as assert } from "node:assert";
import { SessionManager } from "../src/lib/sessionManager";

function deferredResponse() {
  let resolve!: (response: Response) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Response>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const valid = { success: true, valid: true, user: { id: 1, portal: "general" } };
const response = (body = valid) => Response.json(body);

async function main() {
  let now = 100_000;
  const requests: ReturnType<typeof deferredResponse>[] = [];
  const fetcher = (() => {
    const pending = deferredResponse();
    requests.push(pending);
    return pending.promise;
  }) as typeof fetch;
  const manager = new SessionManager(fetcher, () => now);

  const first = manager.checkSession();
  const concurrent = manager.checkSession();
  assert.equal(requests.length, 1, "concurrent consumers share one browser request");
  requests[0].resolve(response());
  assert.deepEqual(await first, valid);
  assert.deepEqual(await concurrent, valid);
  assert.equal(await manager.checkSession(), null, "recent checks are throttled");

  now += 5_001;
  const stale = manager.checkSession();
  const staleConcurrent = manager.checkSession();
  manager.reset(); // A login, logout or completed portal switch invalidates pending checks.
  const fresh = manager.checkSession();
  requests[1].resolve(new Response(null, { status: 401 }));
  assert.equal(await stale, null, "old 401 must not log out a newly logged-in user");
  assert.equal(await staleConcurrent, null, "shared pending check also discards old result");
  const freshConcurrent = manager.checkSession();
  assert.equal(requests.length, 3, "old completion must not clear newer pending request");
  requests[2].resolve(response());
  assert.deepEqual(await fresh, valid);
  assert.deepEqual(await freshConcurrent, valid);

  const beforeLogout = manager.checkSession(true);
  manager.reset();
  requests[3].resolve(response());
  assert.equal(await beforeLogout, null, "old success must not restore user after logout");

  const unauthorized = manager.checkSession(true);
  requests[4].resolve(new Response(null, { status: 401 }));
  assert.deepEqual(await unauthorized, { success: false, valid: false }, "401 explicitly invalidates auth state");

  const unavailable = manager.checkSession(true);
  requests[5].resolve(new Response(null, { status: 500 }));
  await assert.rejects(unavailable, /Session check failed: 500/, "server errors must not masquerade as invalid credentials");
  const networkFailure = manager.checkSession(true);
  requests[6].reject(new Error("offline"));
  await assert.rejects(networkFailure, /offline/);
  const recovered = manager.checkSession(true);
  requests[7].resolve(response());
  assert.deepEqual(await recovered, valid, "failed requests release the pending check");
  console.log("Session manager concurrency validation passed");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
