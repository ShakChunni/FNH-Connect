/**
 * Architectural Validation Test
 * Runs standalone using tsx to verify key business logic changes
 */

import { 
  isReceptionistRole, 
  RECEPTIONIST_ALLOWED_ROUTES,
  isAdminRole
} from "../src/lib/roles";

async function runTests() {
  console.log("🚀 Starting Architectural Validation Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. Access Control Tests (Phase 8) ---
  console.log("--- Testing Access Control (Phase 8) ---");
  
  assert(
    isReceptionistRole("receptionist"), 
    "Standard receptionist should be recognized as receptionist role"
  );
  
  assert(
    isReceptionistRole("receptionist-infertility"), 
    "Infertility receptionist should be recognized as receptionist role (All receptionists get access)"
  );

  assert(
    RECEPTIONIST_ALLOWED_ROUTES.includes("/infertility"),
    "Infertility route should be allowed for all receptionists"
  );

  assert(
    RECEPTIONIST_ALLOWED_ROUTES.includes("/api/infertility"),
    "Infertility API route should be allowed for all receptionists"
  );

  assert(
    !isAdminRole("receptionist"),
    "Receptionist should not be recognized as admin"
  );


  // --- 2. Summary ---
  console.log(`\n--- Test Summary ---`);
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("\n🎉 All architectural validation tests passed!");
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
