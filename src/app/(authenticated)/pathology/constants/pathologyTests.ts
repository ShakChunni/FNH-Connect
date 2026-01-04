/**
 * Pathology Tests Database
 * Complete list of available pathology tests with codes, names, categories, and prices
 * Extracted from public/tests.xlsx
 */

export interface PathologyTestItem {
  code: string;
  name: string;
  category: string;
  price: number; // Price in BDT
}

export const PATHOLOGY_TESTS: PathologyTestItem[] = [
  // Hematology Tests
  {
    code: "TC-DC-HB-ESR",
    name: "TC,DC,HB%,ESR (Blood CP)",
    category: "Hematology",
    price: 200,
  },
  {
    code: "PROTHROMBIN",
    name: "Prothombin Time",
    category: "Hematology",
    price: 1000,
  },
  {
    code: "HB",
    name: "HB%",
    category: "Hematology",
    price: 200,
  },
  {
    code: "BT-CT",
    name: "BT, CT",
    category: "Hematology",
    price: 350,
  },
  {
    code: "CE",
    name: "CE (Circulating Eosin Phil)",
    category: "Hematology",
    price: 200,
  },
  {
    code: "PLATELET-COUNT",
    name: "Platelet Count",
    category: "Hematology",
    price: 200,
  },
  {
    code: "BLOOD-GROUP-RH",
    name: "Blood Group & Rh Factor",
    category: "Hematology",
    price: 100,
  },
  {
    code: "CROSS-MATCH",
    name: "Cross Match (Screening Test)",
    category: "Hematology",
    price: 1000,
  },
  {
    code: "CBC",
    name: "CBC",
    category: "Hematology",
    price: 200,
  },
  {
    code: "TOTAL-EOSINOPHIL",
    name: "Total Esonophil Count",
    category: "Hematology",
    price: 300,
  },

  // Biochemistry / Glucose Tests
  {
    code: "RBS",
    name: "RBS (Random Blood Sugar)",
    category: "Biochemistry",
    price: 100,
  },
  {
    code: "RBS-CUS",
    name: "RBS (Random Blood Sugar) with CUS",
    category: "Biochemistry",
    price: 200,
  },
  {
    code: "FBS",
    name: "Fasting Blood Sugar",
    category: "Biochemistry",
    price: 100,
  },
  {
    code: "2HABF",
    name: "2 Hours After Breakfast (2HABF)",
    category: "Biochemistry",
    price: 100,
  },
  {
    code: "2HABF-CUS",
    name: "2 Hours After Breakfast (2HABF) with CUS",
    category: "Biochemistry",
    price: 200,
  },
  {
    code: "2H-75GM",
    name: "2 Hours After 75gm Glucose Drink",
    category: "Biochemistry",
    price: 100,
  },
  {
    code: "2H-75GM-CUS",
    name: "2 Hours After 75gm Glucose Drink with CUS",
    category: "Biochemistry",
    price: 200,
  },
  {
    code: "OGTT",
    name: "OGTT",
    category: "Biochemistry",
    price: 300,
  },
  {
    code: "HBA1C",
    name: "HbA1C",
    category: "Diabetes Monitoring",
    price: 1000,
  },

  // Infectious Disease Tests
  {
    code: "ICT-MALARIA",
    name: "ICT Malaria",
    category: "Infectious Disease",
    price: 600,
  },
  {
    code: "MP",
    name: "MP (Malaria Parasite)",
    category: "Infectious Disease",
    price: 200,
  },
  {
    code: "ICT-TB",
    name: "ICT for TB",
    category: "Infectious Disease",
    price: 600,
  },
  {
    code: "ICT-KALA-AZAR",
    name: "ICT for Kala-Azar (Ag/Ab)",
    category: "Infectious Disease",
    price: 800,
  },
  {
    code: "ANTI-HIV",
    name: "Anti HIV (ICT)",
    category: "Infectious Disease",
    price: 700,
  },
  {
    code: "WIDAL",
    name: "Widal Test",
    category: "Infectious Disease",
    price: 500,
  },

  // Immunology Tests
  {
    code: "ASO",
    name: "ASO Titre",
    category: "Immunology",
    price: 500,
  },
  {
    code: "CRP",
    name: "CRP",
    category: "Immunology",
    price: 500,
  },
  {
    code: "RA-TEST",
    name: "R.A. Test",
    category: "Immunology",
    price: 500,
  },
  {
    code: "RA-TURBIDIMETRIC",
    name: "R.A. Test (Turbidimetric)",
    category: "Immunology",
    price: 600,
  },

  // Serology Tests
  {
    code: "TPHA",
    name: "TPHA",
    category: "Serology",
    price: 500,
  },
  {
    code: "VDRL",
    name: "VDRL",
    category: "Serology",
    price: 300,
  },
  {
    code: "HBSAG",
    name: "HBsAg",
    category: "Serology",
    price: 500,
  },
  {
    code: "HBSAG-ELISA",
    name: "HBsAg (Ellsa)",
    category: "Serology",
    price: 1200,
  },
  {
    code: "HCV",
    name: "HCV",
    category: "Serology",
    price: 600,
  },
  {
    code: "HPV-DNA",
    name: "HPV DNA Test",
    category: "Serology",
    price: 3000,
  },

  // Liver Function Tests
  {
    code: "S-BILIRUBIN",
    name: "S. Bilirubin",
    category: "Liver Function",
    price: 250,
  },
  {
    code: "SGPT",
    name: "SGPT (ALT)",
    category: "Liver Function",
    price: 400,
  },
  {
    code: "SGOT",
    name: "SGOT (AST)",
    category: "Liver Function",
    price: 400,
  },
  {
    code: "S-ALBUMIN",
    name: "S.Albumin",
    category: "Liver Function",
    price: 500,
  },
  {
    code: "S-ALKALINE-PHOSPHATASE",
    name: "S. Alkaline Phosphatase",
    category: "Liver Function",
    price: 500,
  },

  // Kidney Function Tests
  {
    code: "S-CREATININE",
    name: "Serum Creatinine",
    category: "Kidney Function",
    price: 400,
  },
  {
    code: "S-UREA",
    name: "Serum Urea",
    category: "Kidney Function",
    price: 400,
  },
  {
    code: "BLOOD-UREA",
    name: "Blood Urea",
    category: "Kidney Function",
    price: 400,
  },
  {
    code: "S-URIC-ACID",
    name: "Serum Uric Acid",
    category: "Kidney Function",
    price: 500,
  },

  // Enzyme Tests
  {
    code: "S-AMYLASE",
    name: "Serum Amylase",
    category: "Enzymes",
    price: 1000,
  },

  // Lipid Profile
  {
    code: "LIPID-PROFILE",
    name: "Lipid Profile",
    category: "Biochemistry",
    price: 1000,
  },

  // Electrolytes
  {
    code: "ELECTROLYTE",
    name: "Electrolyte",
    category: "Electrolytes",
    price: 1000,
  },

  // Thyroid Function Tests
  {
    code: "FT3",
    name: "Free Trilodothyorine (FT3)",
    category: "Thyroid Function",
    price: 1000,
  },
  {
    code: "FT4",
    name: "Free Thyroxine (FT4)",
    category: "Thyroid Function",
    price: 1000,
  },
  {
    code: "T3-T4-TSH",
    name: "T3, T4 & TSH",
    category: "Thyroid Function",
    price: 2400,
  },
  {
    code: "TSH",
    name: "TSH",
    category: "Thyroid Function",
    price: 900,
  },

  // Hormones
  {
    code: "LH",
    name: "LH",
    category: "Hormones",
    price: 1200,
  },
  {
    code: "FSH",
    name: "FSH",
    category: "Hormones",
    price: 1200,
  },
  {
    code: "PROLACTIN",
    name: "Prolactin",
    category: "Hormones",
    price: 1200,
  },
  {
    code: "TESTOSTERONE",
    name: "Testosterone",
    category: "Hormones",
    price: 1200,
  },
  {
    code: "OESTROGEN",
    name: "Oestrogen",
    category: "Hormones",
    price: 1200,
  },

  // Tumor Markers
  {
    code: "CA-125",
    name: "CA-125",
    category: "Tumor Markers",
    price: 1200,
  },
  {
    code: "BETA-HCG",
    name: "Beta HCG",
    category: "Tumor Markers",
    price: 1200,
  },
  {
    code: "CEA",
    name: "CEA",
    category: "Tumor Markers",
    price: 1200,
  },
  {
    code: "CA-19-9",
    name: "C-A 19-9",
    category: "Tumor Markers",
    price: 1200,
  },
  {
    code: "AFP",
    name: "α-Fetoprotein",
    category: "Tumor Markers",
    price: 1200,
  },
  {
    code: "AMH",
    name: "AMH",
    category: "Hormones",
    price: 3000,
  },

  // Urinalysis
  {
    code: "URINE-RE",
    name: "Urine R/E",
    category: "Urinalysis",
    price: 200,
  },
  {
    code: "URINE-CS",
    name: "Urine for C/S",
    category: "Urinalysis",
    price: 1000,
  },
  {
    code: "RA-TEST-URINE",
    name: "R/A test",
    category: "Urinalysis",
    price: 200,
  },

  // Microbiology / Culture & Sensitivity
  {
    code: "HIGH-VAG-SWAB",
    name: "High Vag Swab C/S",
    category: "Microbiology",
    price: 1000,
  },
  {
    code: "SEMEN-CS",
    name: "Semen C/S",
    category: "Microbiology",
    price: 1000,
  },
  {
    code: "SEMEN-ANALYSIS",
    name: "Semen Analysis",
    category: "Microbiology",
    price: 600,
  },

  // Pregnancy Test
  {
    code: "PREGNANCY",
    name: "Pregnancy",
    category: "Pregnancy",
    price: 250,
  },

  // Radiology / Imaging
  {
    code: "ECG",
    name: "ECG",
    category: "Cardiology",
    price: 300,
  },
  {
    code: "COLONOSCOPY",
    name: "Colonoscopy",
    category: "Endoscopy",
    price: 5000,
  },

  // Ultrasound Tests
  {
    code: "USG-WHOLE-ABDOMEN",
    name: "Whole Abdomen",
    category: "Ultrasound",
    price: 1000,
  },
  {
    code: "USG-LOWER-ABDOMEN",
    name: "Lower Abdomen",
    category: "Ultrasound",
    price: 800,
  },
  {
    code: "USG-HBS-LIVER-GB",
    name: "HBS/Liver & Gall Bladder",
    category: "Ultrasound",
    price: 900,
  },
  {
    code: "USG-PELVIC",
    name: "Pelvic Organs",
    category: "Ultrasound",
    price: 900,
  },
  {
    code: "USG-PREGNANCY",
    name: "Pregnancy Profile",
    category: "Ultrasound",
    price: 900,
  },
  {
    code: "USG-KUB",
    name: "Kidney & Urinary Bladder (KUB)",
    category: "Ultrasound",
    price: 900,
  },
  {
    code: "USG-BIOPHYSICAL",
    name: "Biophysical Profile",
    category: "Ultrasound",
    price: 1100,
  },
  {
    code: "USG-BREAST-SINGLE",
    name: "Breast",
    category: "Ultrasound",
    price: 1000,
  },
  {
    code: "USG-BREAST-BOTH",
    name: "Breast (Both)",
    category: "Ultrasound",
    price: 2000,
  },
  {
    code: "USG-4D-DUPLEX",
    name: "Color Duplex-4D (Right/Left)",
    category: "Ultrasound",
    price: 2000,
  },
  {
    code: "TVS",
    name: "TVS",
    category: "Ultrasound",
    price: 2000,
  },

  // Other Tests
  {
    code: "PS",
    name: "P/s",
    category: "Other",
    price: 500,
  },
  {
    code: "PS-EXAM",
    name: "Ps Exam",
    category: "Other",
    price: 500,
  },

  // Vitamins
  {
    code: "VITAMIN-D",
    name: "Vitamin D (25-OH Vit-D Total)",
    category: "Vitamins",
    price: 2200,
  },
];

// Category list for filtering
export const PATHOLOGY_CATEGORIES = Array.from(
  new Set(PATHOLOGY_TESTS.map((test) => test.category))
).sort();

// Helper function to get test by code
export function getTestByCode(code: string): PathologyTestItem | undefined {
  return PATHOLOGY_TESTS.find((test) => test.code === code);
}

// Helper function to get tests by category
export function getTestsByCategory(category: string): PathologyTestItem[] {
  return PATHOLOGY_TESTS.filter((test) => test.category === category);
}

// Helper function to calculate total price
export function calculateTotalPrice(testCodes: string[]): number {
  return testCodes.reduce((total, code) => {
    const test = getTestByCode(code);
    return total + (test?.price || 0);
  }, 0);
}
