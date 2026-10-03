import assert from "node:assert/strict";
import { test } from "node:test";
import {
  analyzeProgramQualification,
  MAX_QUALIFICATION_FILE_BYTES,
  parseQualificationCsv,
} from "./program-qualification.ts";
import {
  generateSyntheticQualificationDataset,
  syntheticCriteriaFor,
  type SyntheticScenario,
} from "./synthetic-qualification.ts";

function executeScenario(scenario: SyntheticScenario) {
  const dataset = generateSyntheticQualificationDataset({ scenario, scale: "standard", seed: 20261003 });
  const rows = parseQualificationCsv(dataset.csv);
  const analysis = analyzeProgramQualification({
    rows,
    baselineRevision: "SIM-BASE-01",
    candidateRevision: "SIM-CAND-02",
    criteria: syntheticCriteriaFor(dataset),
  });
  return { dataset, rows, analysis };
}

test("seed and profile produce repeatable paired rows accepted by the production CSV parser", () => {
  const first = generateSyntheticQualificationDataset({ scenario: "nominal", scale: "pilot", seed: 99 });
  const second = generateSyntheticQualificationDataset({ scenario: "nominal", scale: "pilot", seed: 99 });
  assert.equal(first.csv, second.csv);
  assert.equal(first.pairCount, 4_000);
  assert.equal(first.rowCount, 8_000);
  assert.equal(parseQualificationCsv(first.csv).length, first.rowCount);
});

test("nominal qualification reaches engineering review while fault-injection scenarios are held", () => {
  const nominal = executeScenario("nominal");
  assert.equal(nominal.dataset.pairCount, 12_800);
  assert.equal(nominal.rows.length, 25_600);
  assert.equal(nominal.analysis.matchedCount, 12_800);
  assert.equal(nominal.analysis.disposition, "ENGINEERING REVIEW 가능");

  for (const scenario of ["socket-contact", "interconnect", "thermal-corner"] as const) {
    const run = executeScenario(scenario);
    assert.equal(run.analysis.disposition, "HOLD · 원인 검토", `${scenario} should trip a review gate`);
  }
});

test("extended synthetic CSV stays inside the public demo file and row limits", () => {
  const dataset = generateSyntheticQualificationDataset({ scenario: "nominal", scale: "extended", seed: 20261003 });
  assert.equal(dataset.pairCount, 20_000);
  assert.equal(dataset.rowCount, 40_000);
  assert.ok(Buffer.byteLength(dataset.csv, "utf8") <= MAX_QUALIFICATION_FILE_BYTES);
  assert.equal(parseQualificationCsv(dataset.csv).length, dataset.rowCount);
});

test("invalid seed is rejected instead of silently changing the repeatability contract", () => {
  assert.throws(() => generateSyntheticQualificationDataset({ scenario: "nominal", scale: "pilot", seed: 0 }), /Seed/);
  assert.throws(() => generateSyntheticQualificationDataset({ scenario: "nominal", scale: "pilot", seed: 1.5 }), /Seed/);
});
