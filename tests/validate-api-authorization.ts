import assert from "node:assert/strict";
import Module from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { canAccessApplicationPath, parsePositiveIntegerId } from "../src/lib/roles";

const allow = canAccessApplicationPath;
let assertions = 0;
function check(actual: unknown, expected: unknown, message: string) {
  assert.deepEqual(actual, expected, message);
  assertions++;
}
const roles = ["system-admin", "admin", "receptionist", "receptionist-infertility", "medicine-pharmacist", "staff", "unrecognized"];
for (const role of roles) {
  check(allow(role, "general", "/api/admin/user-management"), role === "system-admin", `${role}: user management`);
  check(allow(role, "general", "/api/admin/activity-logs"), ["system-admin", "admin"].includes(role), `${role}: admin logs`);
  check(allow(role, "general", "/api/infertility-patients/123.json"), false, `${role}: general portal cannot cross infertility boundary`);
  check(allow(role, "infertility", "/api/admissions/123.json"), false, `${role}: infertility portal cannot cross admission boundary`);
}
for (const path of ["/api/admissions", "/api/admissions/123", "/api/pathology-patients", "/api/doctor-chamber", "/api/patient-records", "/api/staff/doctors", "/api/hospitals", "/api/departments", "/api/shifts/end"]) {
  check(allow("receptionist", "general", path), true, `general receptionist normal workflow: ${path}`);
}
for (const role of ["receptionist", "receptionist-infertility"]) {
  for (const path of ["/api/infertility-patients", "/api/infertility-patients/tests/123", "/api/patient-records", "/api/staff/doctors", "/api/hospitals", "/api/infertility/cash-tracking"]) {
    check(allow(role, "infertility", path), true, `infertility dropdown and patient workflow: ${role} ${path}`);
  }
}
check(allow("medicine-pharmacist", "general", "/api/patient-records"), true, "pharmacy shared lookup");
check(allow("medicine-pharmacist", "general", "/api/patient-records/123"), false, "pharmacy cannot fetch complete clinical record");
check(allow("medicine-pharmacist", "general", "/api/patient-records", "PATCH"), false, "pharmacy cannot edit patients");
check(allow("receptionist", "general", "/api/hospitals", "POST"), true, "preserve hospital creation during receptionist data entry");
check(allow("receptionist-infertility", "infertility", "/api/shifts/end", "POST"), true, "infertility shift-end logout remains accessible");
check(allow("medicine-pharmacist", "general", "/api/shifts/end", "POST"), true, "pharmacy shift-end logout remains accessible");
check(allow("receptionist-infertility", "general", "/api/patient-records"), false, "infertility-only role cannot use general portal");
check(allow("SysAdmin", "general", "/api/admin/user-management"), true, "supported legacy role alias");
for (const id of ["123.json", "123.png", "123abc", "123/", "1.1", "1e2", "0x10", "-1", "+1", " 1", "1 ", "0", "01", "", "9007199254740992", "2147483648"]) {
  check(Number.isNaN(parsePositiveIntegerId(id)), true, `strict ID rejects ${JSON.stringify(id)}`);
}
check(parsePositiveIntegerId("123"), 123, "ordinary positive ID");

// Exercise real authorization responses and patient route with mocked persistence.
const originalLoad = (Module as any)._load;
let user: any = null;
let rateResult = { allowed: true, retryAfter: 9 };
let rateFailure = false;
let dataReads = 0;
let patientResult: any = null;
let loggedOutUserId: number | null = null;
const persistence = {
  patient: { findFirst: async () => { dataReads++; return patientResult; } },
  activityLog: { findFirst: async () => null, create: async () => ({}) },
  hospital: { findMany: async () => [], findUnique: async () => null, create: async ({ data }: any) => ({ id: 10, ...data }) },
  session: { count: async () => 1, deleteMany: async ({ where }: any) => { loggedOutUserId = where.userId; return { count: 1 }; } },
};
(Module as any)._load = function(request: string, ...args: any[]) {
  if (request === "./rateLimit") return {
    getApiRateLimitOptions: (id: number) => ({ key: `user:${id}` }),
    consumeRateLimit: async () => { if (rateFailure) throw new Error("store unavailable"); return rateResult; },
  };
  if (request === "@/services/infertilityService") return { getInfertilityPatientById: async () => { dataReads++; return patientResult; } };
  if (request === "@/services/medicineInventoryService") return { getMedicineInventoryStats: async () => ({ stats: {}, lowStockItems: [] }) };
  if (request === "@/services/staffShiftClosureService") return { closeActiveStaffCashShifts: async () => ({ generalShiftId: 1, infertilityShiftId: null, closedCount: 1 }) };
  if (request === "@/lib/auth-validation") return { getAuthenticatedUserForAPI: async () => user };
  if (request === "@/lib/prisma") return { prisma: { ...persistence, $transaction: async (callback: any) => callback(persistence) } };
  return originalLoad.call(this, request, ...args);
};
async function main() {
  const { authorizeAPIRequest } = await import("../src/lib/apiAuthorization");
  const { GET } = await import("../src/app/api/patient-records/[id]/route");
  const shiftRoute = await import("../src/app/api/shifts/end/route");
  const pharmacyRoute = await import("../src/app/api/medicine-inventory/route");
  const hospitalRoute = await import("../src/app/api/hospitals/route");
  const infertilityRoute = await import("../src/app/api/infertility-patients/[id]/route");
  const { NextRequest } = await import("next/server");
  const invoke = (id: string) => GET(new NextRequest(`http://localhost/api/patient-records/${id}`), { params: Promise.resolve({ id }) });
  check((await invoke("123" )).status, 401, "unauthenticated actual handler");
  user = { id: 7, role: "unrecognized", portal: "general" };
  check((await invoke("123")).status, 403, "unknown role actual handler");
  user = { id: 7, role: "receptionist", portal: "general" };
  check((await invoke("123.json")).status, 400, "suffix rejected by actual patient handler");
  check(dataReads, 0, "unauthorized and malformed requests never query patient data");
  check((await invoke("123")).status, 404, "valid patient ID reaches persistence normally");
  check(dataReads, 1, "normal authorized route queries patient data");
  check((await authorizeAPIRequest(user, "/api/infertility-patients/123.json"))?.status, 403, "cross-portal suffix request denied by authoritative guard");
  check((await infertilityRoute.GET(new NextRequest("http://localhost/api/infertility-patients/123.json"), { params: Promise.resolve({ id: "123.json" }) })).status, 403, "actual infertility handler rejects general receptionist suffix bypass");
  user = { id: 7, role: "receptionist", portal: "infertility" };
  check((await infertilityRoute.GET(new NextRequest("http://localhost/api/infertility-patients/123.json"), { params: Promise.resolve({ id: "123.json" }) })).status, 400, "infertility handler rejects suffix even for correct portal");
  patientResult = { id: 123, fullName: "Test patient" };
  for (const role of ["system-admin", "admin", "receptionist", "receptionist-infertility"]) {
    user = { id: 7, role, portal: "infertility" };
    check((await infertilityRoute.GET(new NextRequest("http://localhost/api/infertility-patients/123"), { params: Promise.resolve({ id: "123" }) })).status, 200, `normal infertility patient lookup succeeds: ${role}`);
    check((await hospitalRoute.GET(new NextRequest("http://localhost/api/hospitals"))).status, 200, `normal shared hospital lookup succeeds: ${role}`);
  }
  for (const role of ["system-admin", "admin", "receptionist", "staff"]) {
    user = { id: 7, role, portal: "general" };
    check((await invoke("123")).status, 200, `normal general patient lookup succeeds: ${role}`);
  }
  const csrf = "valid-test-csrf";
  for (const [role, portal] of [["receptionist", "general"], ["receptionist-infertility", "infertility"], ["medicine-pharmacist", "general"]]) {
    user = { id: 7, staffId: 9, role, portal, sessionDeviceInfo: {} };
    const response = await shiftRoute.POST(new NextRequest("http://localhost/api/shifts/end", { method: "POST", headers: { cookie: `csrf-token=${csrf}`, "x-csrf-token": csrf } }));
    check(response.status, 200, `end-shift logout succeeds: ${role}`);
    check(loggedOutUserId, 7, `end-shift revokes only current user's sessions: ${role}`);
    check(response.cookies.get("session")?.value, "", `end-shift clears browser session: ${role}`);
    if (role !== "medicine-pharmacist") {
      const created = await hospitalRoute.POST(new NextRequest("http://localhost/api/hospitals", { method: "POST", headers: { cookie: `csrf-token=${csrf}`, "x-csrf-token": csrf, "Content-Type": "application/json" }, body: JSON.stringify({ name: "Referral Hospital" }) }));
      check(created.status, 201, `hospital creation during receptionist entry succeeds: ${role}`);
    }
  }
  user = { id: 7, role: "medicine-pharmacist", portal: "general" };
  check((await pharmacyRoute.GET(new NextRequest("http://localhost/api/medicine-inventory"))).status, 200, "pharmacist inventory dashboard succeeds");
  check((await invoke("123")).status, 403, "actual full patient record handler denies pharmacy role");
  user = { id: 7, role: "receptionist", portal: "general" };
  check((await pharmacyRoute.GET(new NextRequest("http://localhost/api/medicine-inventory"))).status, 403, "actual pharmacy handler denies receptionist role");
  rateResult = { allowed: false, retryAfter: 9 };
  const limited = await authorizeAPIRequest(user, "/api/admissions");
  check(limited?.status, 429, "shared limiter blocks exhausted user");
  check(limited?.headers.get("Retry-After"), "9", "limiter exposes retry delay");
  rateFailure = true;
  const originalError = console.error;
  console.error = () => {};
  try { check((await authorizeAPIRequest(user, "/api/admissions"))?.status, 503, "limiter store failure denies request"); }
  finally { console.error = originalError; }

  function inspect(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { inspect(path); continue; }
      if (entry.name !== "route.ts" || /\/api\/(auth|security|internal)\//.test(path)) continue;
      const source = readFileSync(path, "utf8");
      check(source.includes("await authorizeAPIRequest("), true, `business handler defense: ${path}`);
      check(/parseInt\(id(?:,|\))/.test(source), false, `no partial dynamic ID parser: ${path}`);
    }
  }
  inspect("src/app/api");
  const middleware = readFileSync("src/middleware.ts", "utf8");
  check(middleware.includes('"/api/:path*"'), true, "all API suffixes always match middleware");
  console.log(`API authorization regression checks passed (${assertions} assertions).`);
}
main().finally(() => { (Module as any)._load = originalLoad; }).catch(error => { console.error(error); process.exitCode = 1; });
