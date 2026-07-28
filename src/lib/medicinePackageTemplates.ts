/**
 * Medicine Package Templates
 *
 * Source-controlled templates for operation-specific medicine packages.
 * These templates contain medicine names only — no prices, no stock.
 *
 * Each template item carries the original PDF spelling as `templateName`
 * plus one or more `aliases` that are used to look up a live pharmacy
 * `Medicine` record by `brandName` or `genericName`.
 *
 * Renamed from the original admission-only file so the same template can
 * be used by Medicine Inventory and General Admission.
 */

export interface MedicinePackageTemplateItem {
  templateName: string;
  aliases: string[];
  quantity?: number;
}

export interface MedicinePackageTemplate {
  code: string;
  name: string;
  operationName: string;
  /** Stable live department id. Null means the preset is global. */
  departmentId?: number | null;
  /** Department label used to decide where this preset is offered. */
  departmentName: string;
  items: MedicinePackageTemplateItem[];
}

export const MEDICINE_PACKAGE_TEMPLATES: MedicinePackageTemplate[] = [
  {
    code: "LUCS_OT_MEDICINE",
    name: "LUCS Ot medicine",
    operationName: "LUCS",
    departmentId: null,
    departmentName: "Gynecology",
    items: [
      { templateName: "IV Cannula", aliases: ["IV Cannula"] },
      { templateName: "Seline Set", aliases: ["Seline Set", "Saline Set"] },
      {
        templateName: "Inf H/s",
        aliases: [
          "Inf H/s",
          "Hartmann",
          "Hartmann's Solution",
          "Hartmann Solution",
          "H/S",
        ],
      },
      { templateName: "DNS", aliases: ["DNS", "Dextrose Normal Saline"] },
      { templateName: "Inj Esoral", aliases: ["Inj Esoral", "Esoral"] },
      { templateName: "Inj Topcef", aliases: ["Inj Topcef", "Topcef"] },
      {
        templateName: "Inj vergon",
        aliases: ["Inj vergon", "Inj Vergon", "Vergon"],
      },
      {
        templateName: "Inj Metro",
        aliases: [
          "Metro 100ml infusion",
          "Metro 100 ml infusion",
          "Metronidazole 100ml infusion",
          "Metronidazole 100 ml infusion",
          "Metronidazole infusion",
          "Inj Metro",
          "Metro",
        ],
      },
      {
        templateName: "Inj Ultra Caine",
        aliases: ["Inj Ultra Caine", "Ultra Caine", "Ultracaine"],
      },
      {
        templateName: "Inj Duratocin",
        aliases: [
          "Duratocin 100 mcg/1 ml",
          "Duratocin 100mcg/1ml",
          "Duratocin 100 mcg 1 ml",
          "Carbetocin 100 mcg/1 ml",
          "Carbetocin 100mcg/1ml",
          "Inj Duratocin",
          "Duratocin",
        ],
      },
      {
        templateName: "Inj Linda/Ds",
        aliases: ["Inj Linda/Ds", "Linda/Ds", "Linda DS", "Lindamax DS"],
      },
      {
        templateName: "Spinal Nedle",
        aliases: ["Spinal Nedle", "Spinal Needle"],
      },
      {
        templateName: "F Cathertar",
        aliases: [
          "F Cathertar",
          "F Catheter",
          "Foley Catheter",
          "Foley Catheter 16",
          "Foley Catheter 18",
        ],
      },
      { templateName: "Urin Bag", aliases: ["Urin Bag", "Urine Bag"] },
      {
        templateName: "Gloves",
        aliases: [
          "Gloves 6.5",
          "Gloves 6.6",
          "Surgical Gloves",
          "Sterile Gloves",
          "Gloves",
        ],
      },
      {
        templateName: "Hexicol 100 ML",
        aliases: ["Hexicol 100 ML", "Hexicol 100ml", "Hexisol 100ml"],
      },
      {
        templateName: "Viodin 100 ML",
        aliases: [
          "Viodin 100 ML",
          "Viodin 100ml",
          "Viodine 100ml",
          "Povidone Iodine 100ml",
          "Povidone Iodine",
        ],
      },
      {
        templateName: "Syring 5 ML",
        aliases: ["Syring 5 ML", "Syringe 5 ML", "Syringe 5ml"],
      },
      {
        templateName: "Syring 3 ML",
        aliases: ["Syring 3 ML", "Syringe 3 ML", "Syringe 3ml"],
      },
      { templateName: "Mitsu 180 cm", aliases: ["Mitsu 180 cm", "Mitsu"] },
      { templateName: "Nichepore", aliases: ["Nichepore"] },
      { templateName: "BP Blade 20", aliases: ["BP Blade 20", "Blade 20"] },
      {
        templateName: "Cap Duracef 400 mg",
        aliases: ["Cap Duracef 400 mg", "Duracef 400 mg"],
      },
      {
        templateName: "Cap. Maxpro 20 mg",
        aliases: ["Cap. Maxpro 20 mg", "Maxpro 20 mg"],
      },
      {
        templateName: "Cap. Flucloxin 500 Mg",
        aliases: ["Cap. Flucloxin 500 Mg", "Flucloxin 500 Mg"],
      },
      {
        templateName: "Tab. Sedil 0.5 Mg",
        aliases: ["Tab. Sedil 0.5 Mg", "Sedil 0.5 Mg"],
      },
      {
        templateName: "Tab. Metro 400 mg",
        aliases: ["Tab. Metro 400 mg", "Metro 400 mg"],
      },
      {
        templateName: "Tab. Napa 500 mg",
        aliases: ["Tab. Napa 500 mg", "Napa 500 mg"],
      },
      { templateName: "Tab. Cevit", aliases: ["Tab. Cevit", "Cevit"] },
    ],
  },
];

export function findMedicinePackageTemplate(
  code: string,
): MedicinePackageTemplate | undefined {
  return MEDICINE_PACKAGE_TEMPLATES.find(
    (template) => template.code === code,
  );
}
