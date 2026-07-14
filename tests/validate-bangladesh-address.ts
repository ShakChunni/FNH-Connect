/**
 * Bangladesh Address Domain Validation
 *
 * Standalone validation script that exercises the shared address domain
 * utilities. Run with `npx tsx tests/validate-bangladesh-address.ts`.
 *
 * Uses Node's `assert/strict` API and exits with a non-zero status code
 * if any check fails. No Prisma, no UI dependencies, no fixtures.
 */

import { strict as assert } from "node:assert";
import {
  BANGLADESH_DISTRICTS,
  canonicalizeBangladeshAddress,
  formatBangladeshAddress,
  getBangladeshDistrictSuggestions,
  hasRequiredBangladeshDistrict,
  isBangladeshDistrict,
  parseBangladeshAddress,
  type BangladeshDistrict,
} from "../src/lib/bangladeshAddress";
import { patientAddressSchema } from "../src/lib/bangladeshAddressSchema";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean): void {
  if (condition) {
    console.log(`PASS: ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL: ${label}`);
    failed += 1;
  }
}

function group(title: string): void {
  console.log(`\n--- ${title} ---`);
}

group("District dataset");

check(
  "Exactly 64 canonical districts are defined",
  BANGLADESH_DISTRICTS.length === 64,
);

const sortedCopy = [...BANGLADESH_DISTRICTS].sort((a, b) =>
  a.localeCompare(b),
);
check(
  "Canonical list is alphabetically sorted",
  BANGLADESH_DISTRICTS.every((name, index) => name === sortedCopy[index]),
);

const uniqueSet = new Set(BANGLADESH_DISTRICTS.map((name) => name.toLowerCase()));
check(
  "No duplicate canonical entries (case-insensitive)",
  uniqueSet.size === BANGLADESH_DISTRICTS.length,
);

check(
  "Cox's Bazar uses ASCII apostrophe",
  BANGLADESH_DISTRICTS.includes("Cox's Bazar") &&
    !BANGLADESH_DISTRICTS.some((d) => d.includes("\u2019")),
);

check(
  "isBangladeshDistrict accepts canonical names case-insensitively",
  isBangladeshDistrict("dhaka") &&
    isBangladeshDistrict("Dhaka") &&
    isBangladeshDistrict("CHATTOGRAM"),
);

check(
  "isBangladeshDistrict rejects unknown values",
  !isBangladeshDistrict("OldDhaka") && !isBangladeshDistrict("Barisal"),
);

group("formatBangladeshAddress");

check(
  "District-only value formats without trailing comma",
  formatBangladeshAddress("", "Dhaka") === "Dhaka",
);

check(
  "Details + district formats as `details, district`",
  formatBangladeshAddress("Village, Upazila", "Kishoreganj") ===
    "Village, Upazila, Kishoreganj",
);

check(
  "Empty details + empty district produces empty string",
  formatBangladeshAddress("", "") === "",
);

check(
  "Whitespace is trimmed from both segments",
  formatBangladeshAddress("  Details ", " Dhaka " as BangladeshDistrict) ===
    "Details, Dhaka",
);

check(
  "Empty comma-separated detail segments are removed during formatting",
  formatBangladeshAddress("Village, , Upazila,", "Dhaka") ===
    "Village, Upazila, Dhaka",
);

check(
  "Null/empty details with a district still formats the district",
  formatBangladeshAddress("", "  Chattogram  " as BangladeshDistrict) ===
    "Chattogram",
);

group("parseBangladeshAddress");

const canonicalParsed = parseBangladeshAddress(
  "Village, Upazila, Kishoreganj",
);
check(
  "Canonical final segment is recognised as district",
  canonicalParsed.district === "Kishoreganj" &&
    canonicalParsed.addressDetails === "Village, Upazila" &&
    canonicalParsed.isLegacy === false,
);

const districtOnlyParsed = parseBangladeshAddress("Dhaka");
check(
  "District-only input parses with empty details and no legacy flag",
  districtOnlyParsed.district === "Dhaka" &&
    districtOnlyParsed.addressDetails === "" &&
    districtOnlyParsed.isLegacy === false,
);

const aliasParsed = parseBangladeshAddress("Village, Barisal");
check(
  "Legacy alias final segment is recognised and flagged as legacy",
  aliasParsed.district === "Barishal" &&
    aliasParsed.addressDetails === "Village" &&
    aliasParsed.isLegacy === true,
);

const aliasWithCurlyApostrophe = parseBangladeshAddress(
  "Cox\u2019s Bazar",
);
check(
  "Curly apostrophe alias maps to canonical Cox's Bazar",
  aliasWithCurlyApostrophe.district === "Cox's Bazar" &&
    aliasWithCurlyApostrophe.isLegacy === true,
);

const lowerCaseAliasParsed = parseBangladeshAddress("Some place, comilla");
check(
  "Lowercase alias is still recognised as Comilla alias",
  lowerCaseAliasParsed.district === "Cumilla" &&
    lowerCaseAliasParsed.isLegacy === true,
);

const noDistrict = parseBangladeshAddress("Village, Upazila only");
check(
  "Unrecognised final segment is preserved as legacy details",
  noDistrict.district === "" &&
    noDistrict.addressDetails === "Village, Upazila only" &&
    noDistrict.isLegacy === true,
);

const emptyParsed = parseBangladeshAddress("");
check(
  "Empty string parses to empty fields and no legacy flag",
  emptyParsed.addressDetails === "" &&
    emptyParsed.district === "" &&
    emptyParsed.isLegacy === false,
);

const nullParsed = parseBangladeshAddress(null);
check(
  "null input parses to empty fields and no legacy flag",
  nullParsed.addressDetails === "" &&
    nullParsed.district === "" &&
    nullParsed.isLegacy === false,
);

const undefinedParsed = parseBangladeshAddress(undefined);
check(
  "undefined input parses to empty fields and no legacy flag",
  undefinedParsed.addressDetails === "" &&
    undefinedParsed.district === "" &&
    undefinedParsed.isLegacy === false,
);

const extraCommasParsed = parseBangladeshAddress(
  "Village, , Upazila, , Dhaka",
);
check(
  "Empty comma-separated segments are removed during parsing",
  extraCommasParsed.addressDetails === "Village, Upazila" &&
    extraCommasParsed.district === "Dhaka",
);

const districtInDetails = parseBangladeshAddress(
  "Tangail Road, Not a district",
);
check(
  "District in details is not silently treated as a district when the final segment is unknown",
  districtInDetails.district === "" &&
    districtInDetails.addressDetails === "Tangail Road, Not a district" &&
    districtInDetails.isLegacy === true,
);

const districtNameAsLastSegmentWithDetails = parseBangladeshAddress(
  "Bogura city, Barisal",
);
check(
  "Alias final segment wins over district name in details",
  districtNameAsLastSegmentWithDetails.district === "Barishal" &&
    districtNameAsLastSegmentWithDetails.addressDetails === "Bogura city" &&
    districtNameAsLastSegmentWithDetails.isLegacy === true,
);

const malformed = parseBangladeshAddress(" , , ");
check(
  "Whitespace/comma-only input is treated as empty",
  malformed.addressDetails === "" &&
    malformed.district === "" &&
    malformed.isLegacy === false,
);

group("hasRequiredBangladeshDistrict");

check(
  "Empty / null / undefined address is invalid",
  !hasRequiredBangladeshDistrict("") &&
    !hasRequiredBangladeshDistrict(null) &&
    !hasRequiredBangladeshDistrict(undefined),
);

check(
  "District-only canonical address is valid",
  hasRequiredBangladeshDistrict("Dhaka"),
);

check(
  "District + details canonical address is valid",
  hasRequiredBangladeshDistrict("Village, Kishoreganj"),
);

check(
  "Address ending in legacy alias is valid (canonicalizable)",
  hasRequiredBangladeshDistrict("Village, Barisal"),
);

check(
  "Address without any district is invalid",
  !hasRequiredBangladeshDistrict("Village, Upazila only"),
);

check(
  "Address containing a district name only in details is invalid",
  !hasRequiredBangladeshDistrict("Tangail Road, Mystery"),
);

group("district autocomplete");

check(
  "Autocomplete waits for two characters",
  getBangladeshDistrictSuggestions("d").length === 0 &&
    getBangladeshDistrictSuggestions("dh").includes("Dhaka"),
);

check(
  "Autocomplete recognises legacy spellings and returns canonical names",
  getBangladeshDistrictSuggestions("bogra").includes("Bogura") &&
  getBangladeshDistrictSuggestions("coxs bazar").includes("Cox's Bazar"),
);

group("canonicalizeBangladeshAddress");

check(
  "Canonical address round-trips unchanged",
  canonicalizeBangladeshAddress("Village, Upazila, Kishoreganj") ===
    "Village, Upazila, Kishoreganj",
);

check(
  "District-only address round-trips unchanged",
  canonicalizeBangladeshAddress("Dhaka") === "Dhaka",
);

check(
  "Legacy alias is rewritten to canonical name",
  canonicalizeBangladeshAddress("Village, Barisal") ===
    "Village, Barishal",
);

check(
  "Lowercase alias is rewritten and cased correctly",
  canonicalizeBangladeshAddress("Upazila, comilla") === "Upazila, Cumilla",
);

check(
  "Empty address stays empty after canonicalization",
  canonicalizeBangladeshAddress("") === "",
);

check(
  "Legacy address without district passes through unchanged",
  canonicalizeBangladeshAddress("Village, Unknown") === "Village, Unknown",
);

check(
  "Whitespace and stray commas are cleaned up",
  canonicalizeBangladeshAddress("  Village ,  , Dhaka ") ===
    "Village, Dhaka",
);

group("patientAddressSchema");

const canonicalSchemaResult = patientAddressSchema.safeParse(
  " Village,  , Barisal ",
);
check(
  "Server schema accepts a recognized alias and returns canonical storage",
  canonicalSchemaResult.success &&
    canonicalSchemaResult.data === "Village, Barishal",
);

const freeformSchemaResult = patientAddressSchema.safeParse(
  "Village, Upazila only",
);
check(
  "Server schema rejects a non-empty address without a final district",
  !freeformSchemaResult.success,
);

check(
  "Server schema still rejects an empty address",
  !patientAddressSchema.safeParse("   ").success,
);

console.log("\n--- Summary ---");
console.log(`Total: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  assert.fail(`${failed} Bangladesh address validation check(s) failed.`);
} else {
  console.log("\nAll Bangladesh address validation checks passed.");
}
