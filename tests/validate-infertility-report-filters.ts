import { strict as assert } from "node:assert";
import { buildBDTQueryDateRange } from "../src/lib/timezone";
import { useInfertilityFilterStore } from "../src/app/(authenticated)/infertility/stores/filterStore";
import { useInfertilityTestFilterStore } from "../src/app/(authenticated)/infertility/stores/testFilterStore";

function run(): void {
  const patientStore = useInfertilityFilterStore.getState();
  patientStore.clearAllFilters();
  patientStore.setDateRange("today");

  let patientFilters = useInfertilityFilterStore.getState();
  assert.equal(patientFilters.dateRange, "today");
  assert.ok(patientFilters.startDate);
  assert.ok(patientFilters.endDate);
  assert.equal(
    patientFilters.startDate?.toDateString(),
    patientFilters.endDate?.toDateString(),
    "Today must represent one BDT calendar date",
  );

  const customStart = new Date(2026, 6, 1);
  const customEnd = new Date(2026, 6, 2);
  patientStore.setCustomDateRange(customStart, customEnd);
  patientFilters = useInfertilityFilterStore.getState();
  assert.equal(patientFilters.dateRange, "custom");

  assert.deepEqual(buildBDTQueryDateRange(customStart, customEnd), {
    startDate: "2026-06-30T18:00:00.000Z",
    endDate: "2026-07-02T18:00:00.000Z",
  });

  const investigationStore = useInfertilityTestFilterStore.getState();
  investigationStore.clearAllFilters();
  investigationStore.setCustomDateRange(customStart, customEnd);
  let investigationFilters =
    useInfertilityTestFilterStore.getState().filters;
  assert.equal(investigationFilters.dateRange, "custom");
  assert.equal(investigationFilters.startDate?.getTime(), customStart.getTime());
  assert.equal(investigationFilters.endDate?.getTime(), customEnd.getTime());

  patientStore.clearAllFilters();
  investigationStore.clearAllFilters();
  patientFilters = useInfertilityFilterStore.getState();
  investigationFilters = useInfertilityTestFilterStore.getState().filters;
  assert.equal(patientFilters.dateRange, "all");
  assert.equal(patientFilters.startDate, null);
  assert.equal(patientFilters.endDate, null);
  assert.equal(investigationFilters.dateRange, "all");

  console.log("Infertility report filter validation passed.");
}

run();
