/**
 * Bangladesh Patient Address Domain
 *
 * Single source of truth for the 64 official Bangladesh districts and the
 * canonical address format used by all active patient write flows.
 *
 * Browser-safe: this file must not import Prisma, Node-only modules, or
 * server-only libraries so it can be reused in client components and the
 * address remediation audit script.
 */

export const BANGLADESH_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalakathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
] as const;

export type BangladeshDistrict = (typeof BANGLADESH_DISTRICTS)[number];

export interface ParsedBangladeshAddress {
  addressDetails: string;
  district: BangladeshDistrict | "";
  isLegacy: boolean;
}

/**
 * Lowercased lookup table: alias (or canonical name) → canonical district.
 * Aliases are recognised only when parsing/remediating; they are never
 * shown as selectable dropdown options.
 */
const LEGACY_ALIAS_TO_CANONICAL: Record<string, BangladeshDistrict> = {
  barisal: "Barishal",
  bogra: "Bogura",
  chittagong: "Chattogram",
  comilla: "Cumilla",
  jessore: "Jashore",
  "coxs bazar": "Cox's Bazar",
  "cox’s bazar": "Cox's Bazar",
};

function normalizeDistrictSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const DISTRICT_SEARCH_ENTRIES = BANGLADESH_DISTRICTS.map((district) => ({
  district,
  terms: [
    district,
    ...Object.entries(LEGACY_ALIAS_TO_CANONICAL)
      .filter(([, canonical]) => canonical === district)
      .map(([alias]) => alias),
  ].map(normalizeDistrictSearch),
}));

const CANONICAL_NAME_SET: ReadonlySet<string> = new Set(
  BANGLADESH_DISTRICTS.map((name) => name.toLowerCase()),
);

const CANONICAL_NAME_LOOKUP: Map<string, BangladeshDistrict> = new Map(
  BANGLADESH_DISTRICTS.map((name) => [name.toLowerCase(), name]),
);

function findCanonicalDistrict(
  value: string,
): { district: BangladeshDistrict; isAlias: boolean } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  const direct = CANONICAL_NAME_LOOKUP.get(lower);
  if (direct) {
    return { district: direct, isAlias: false };
  }

  const aliased = LEGACY_ALIAS_TO_CANONICAL[lower];
  if (aliased) {
    return { district: aliased, isAlias: true };
  }

  return null;
}

export function isBangladeshDistrict(
  value: string,
): value is BangladeshDistrict {
  return CANONICAL_NAME_SET.has(value.trim().toLowerCase());
}

/**
 * Returns canonical zilla names for the manual address autocomplete.
 * Suggestions start after two typed characters and include legacy spellings.
 */
export function getBangladeshDistrictSuggestions(
  query: string,
): BangladeshDistrict[] {
  const normalizedQuery = normalizeDistrictSearch(query);
  if (normalizedQuery.length < 2) return [];

  return DISTRICT_SEARCH_ENTRIES
    .filter(({ terms }) =>
      terms.some(
        (term) => term.includes(normalizedQuery) || normalizedQuery.includes(term),
      ),
    )
    .map(({ district }) => district)
    .slice(0, 8);
}

export function formatBangladeshAddress(
  addressDetails: string,
  district: BangladeshDistrict | "",
): string {
  const details = addressDetails
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join(", ");
  const districtTrimmed = (district ?? "").trim();

  if (details && districtTrimmed) {
    return `${details}, ${districtTrimmed}`;
  }
  if (details) return details;
  if (districtTrimmed) return districtTrimmed;
  return "";
}

export function parseBangladeshAddress(
  address: string | null | undefined,
): ParsedBangladeshAddress {
  if (address === null || address === undefined) {
    return { addressDetails: "", district: "", isLegacy: false };
  }

  const trimmed = address.trim();
  if (!trimmed) {
    return { addressDetails: "", district: "", isLegacy: false };
  }

  const segments = trimmed
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return { addressDetails: "", district: "", isLegacy: false };
  }

  const lastSegment = segments[segments.length - 1];
  const match = findCanonicalDistrict(lastSegment);

  if (!match) {
    return {
      addressDetails: trimmed,
      district: "",
      isLegacy: true,
    };
  }

  const detailSegments = segments.slice(0, -1);
  const details = detailSegments.join(", ");

  return {
    addressDetails: details,
    district: match.district,
    isLegacy: match.isAlias,
  };
}

export function hasRequiredBangladeshDistrict(
  address: string | null | undefined,
): boolean {
  if (address === null || address === undefined) return false;
  const parsed = parseBangladeshAddress(address);
  return parsed.district !== "";
}

export function canonicalizeBangladeshAddress(address: string): string {
  const parsed = parseBangladeshAddress(address);
  return formatBangladeshAddress(parsed.addressDetails, parsed.district);
}
