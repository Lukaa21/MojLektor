import { describe, expect, it } from "vitest";
import { createFullDiff } from "../src/core/diff";

describe("createFullDiff reversible model", () => {
  it("creates reversible change objects with group keys", () => {
    const original = "Idem kuci sa Markom. Idem sa tobom.";
    const edited = "Idem kuci s Markom. Idem s tobom.";

    const result = createFullDiff(original, edited);

    expect(result.changes.length).toBeGreaterThan(0);
    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.changes.every((change) => change.groupKey === "sa→s")).toBe(true);
    expect(result.changes.every((change) => change.status === "active")).toBe(true);
  });

  it("keeps start/end indexes inside edited text bounds", () => {
    const original = "Marko ide u skolu.";
    const edited = "Marko ide u školu.";

    const result = createFullDiff(original, edited);

    result.changes.forEach((change) => {
      expect(change.startIndex).toBeGreaterThanOrEqual(0);
      expect(change.endIndex).toBeGreaterThanOrEqual(change.startIndex);
      expect(change.endIndex).toBeLessThanOrEqual(edited.length);
    });
  });
});
