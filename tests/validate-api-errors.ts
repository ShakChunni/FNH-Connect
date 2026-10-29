/* eslint-disable @typescript-eslint/no-require-imports -- CJS loads replace persistence without live services. */
import assert from "node:assert/strict";
import Module from "node:module";
import { NextRequest } from "next/server";
import { PublicError } from "../src/lib/publicError";

const originalLoad = (Module as any)._load;
let failure: Error = new Error("Invalid Prisma invocation: private database; record not found");
(Module as any)._load = function (name: string, ...args: any[]) {
  if (name === "@/lib/auth-validation") return { getAuthenticatedUserForAPI: async () => ({ id: 1, role: "system-admin", portal: "general" }) };
  if (name === "@/lib/apiAuthorization") return { authorizeAPIRequest: async () => null };
  if (name === "@/services/medicinePackageService") return { deleteMedicinePackage: async () => { throw failure; } };
  return originalLoad.call(this, name, ...args);
};

async function main() {
  const { DELETE } = require("../src/app/api/medicine-inventory/sale-packages/route");
  const request = () => new NextRequest("http://localhost/api/medicine-inventory/sale-packages?code=TEST", {
    method: "DELETE", headers: { cookie: "csrf-token=synthetic", "x-csrf-token": "synthetic" },
  });
  const unexpected = await DELETE(request());
  assert.equal(unexpected.status, 500, "a Prisma substring must not misclassify unexpected errors as domain failures");
  assert.deepEqual(await unexpected.json(), { success: false, error: "Package operation failed" });
  failure = new PublicError("Medicine package not found");
  const missing = await DELETE(request());
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error, "Medicine package not found");
  failure = new PublicError("At least one medicine package must remain");
  const minimum = await DELETE(request());
  assert.equal(minimum.status, 400);
  assert.equal((await minimum.json()).error, failure.message, "actionable domain errors are preserved");
  console.log("Actual API unexpected/domain error response validation passed");
}

main().finally(() => { (Module as any)._load = originalLoad; }).catch((error) => { console.error(error); process.exitCode = 1; });
