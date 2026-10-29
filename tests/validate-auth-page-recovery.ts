/* eslint-disable @typescript-eslint/no-require-imports -- CJS loads isolate React navigation effects without a live browser. */
import { strict as assert } from "node:assert";
import Module from "node:module";

// Exercise MainContent's actual redirect effects without a browser renderer.
// Hooks provide an already-hydrated client and capture effects for each render.
const originalLoad = (Module as any)._load;
let auth: any;
let pathname = "/login";
let effects: (() => void)[] = [];
const redirects: string[] = [];
function LoadingState() { return null; }
(Module as any)._load = function (request: string, ...args: any[]) {
  if (request === "./AuthContext") return { useAuth: () => auth };
  if (request === "./LoadingState") return { __esModule: true, default: LoadingState };
  if (request === "next/navigation") return {
    usePathname: () => pathname, useRouter: () => ({ replace: (path: string) => redirects.push(path) }),
  };
  const actual = originalLoad.call(this, request, ...args);
  if (request === "react") return {
    ...actual, useState: () => [true, () => {}], useEffect: (effect: () => void) => effects.push(effect),
  };
  return actual;
};
const originalReactGlobal = (globalThis as any).React;
(globalThis as any).React = require("react");
try {
  const MainContent = require("../src/app/MainContent").default;
  const user = { id: 1, role: "system-admin", portal: "general" };
  const render = (overrides: any = {}) => {
    effects = [];
    redirects.length = 0;
    auth = { user, portal: "general", loading: false, isSwitchingPortal: false,
      canRedirectFromAuthPage: false, ...overrides };
    const result = MainContent({ children: "login form" });
    effects.forEach(effect => effect());
    return result;
  };
  assert.equal(render().props.children, "login form");
  assert.deepEqual(redirects, [], "cached user cannot redirect login before fresh verification");
  assert.equal(render({ user: null, canRedirectFromAuthPage: true }).props.children, "login form");
  assert.deepEqual(redirects, [], "revoked session can reach login");
  assert.equal(render({ canRedirectFromAuthPage: true }).type, LoadingState);
  assert.deepEqual(redirects, ["/dashboard"], "fresh valid DB session returns to its home");
  assert.equal(render({ loading: true }).props.children, "login form");
  assert.deepEqual(redirects, [], "pending login verification never redirects cached user");
  pathname = "/dashboard";
  assert.equal(render({ user: null }).type, LoadingState);
  assert.deepEqual(redirects, ["/login"], "unauthenticated protected pages still require login");
} finally {
  (Module as any)._load = originalLoad;
  (globalThis as any).React = originalReactGlobal;
}
console.log("Auth page recovery validation passed");
