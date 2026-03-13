import { diffWords, type Change } from "diff";
import type { ReversibleChange, ReversibleToken } from "./models";

export type DiffOp =
  | { type: "unchanged"; value: string }
  | { type: "deleted"; value: string }
  | { type: "added"; value: string }
  | { type: "modified"; original: string; edited: string };

const normalizeForGroup = (value: string) => value.replace(/\s+/g, " ").trim();

const buildGroupKey = (original: string, modified: string) =>
  `${normalizeForGroup(original)}→${normalizeForGroup(modified)}`;

export function createTextDiff(original: string, edited: string): DiffOp[] {
  const parts = diffWords(original, edited);
  const result: DiffOp[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (part.removed) {
      const next = parts[index + 1];
      if (next?.added) {
        result.push({
          type: "modified",
          original: part.value,
          edited: next.value,
        });
        index += 1;
        continue;
      }

      result.push({ type: "deleted", value: part.value });
      continue;
    }

    if (part.added) {
      result.push({ type: "added", value: part.value });
      continue;
    }

    result.push({ type: "unchanged", value: part.value });
  }

  return result;
}

const createReversibleModel = (original: string, edited: string) => {
  const parts = diffWords(original, edited);
  const tokens: ReversibleToken[] = [];
  const changes: ReversibleChange[] = [];

  let editedOffset = 0;
  let tokenIndex = 0;
  let changeIndex = 0;

  const createChange = (originalValue: string, modifiedValue: string, startIndex: number, endIndex: number) => {
    const id = `change_${changeIndex}`;
    changeIndex += 1;
    const groupKey = buildGroupKey(originalValue, modifiedValue);

    const change: ReversibleChange = {
      id,
      original: originalValue,
      modified: modifiedValue,
      startIndex,
      endIndex,
      groupKey,
      status: "active",
    };

    changes.push(change);
    return change;
  };

  const pendingRemoved: Change[] = [];

  const flushPendingRemovedAsDeletion = () => {
    if (!pendingRemoved.length) {
      return;
    }

    const originalValue = pendingRemoved.map((part) => part.value).join("");
    createChange(originalValue, "", editedOffset, editedOffset);
    pendingRemoved.length = 0;
  };

  for (const part of parts) {
    if (part.removed) {
      pendingRemoved.push(part);
      continue;
    }

    if (part.added) {
      const removedValue = pendingRemoved.map((entry) => entry.value).join("");
      pendingRemoved.length = 0;

      const startIndex = editedOffset;
      const endIndex = startIndex + part.value.length;
      const change = createChange(removedValue, part.value, startIndex, endIndex);

      tokens.push({
        id: `token_${tokenIndex}`,
        text: part.value,
        startIndex,
        endIndex,
        changeId: change.id,
        groupKey: change.groupKey,
        status: "active",
      });
      tokenIndex += 1;
      editedOffset = endIndex;
      continue;
    }

    flushPendingRemovedAsDeletion();

    const startIndex = editedOffset;
    const endIndex = startIndex + part.value.length;
    tokens.push({
      id: `token_${tokenIndex}`,
      text: part.value,
      startIndex,
      endIndex,
      status: "static",
    });
    tokenIndex += 1;
    editedOffset = endIndex;
  }

  flushPendingRemovedAsDeletion();

  return { tokens, changes };
};

export function createFullDiff(original: string, edited: string) {
  const diff = createTextDiff(original, edited);
  const reversible = createReversibleModel(original, edited);

  return {
    original,
    edited,
    diff,
    changes: reversible.changes,
    tokens: reversible.tokens,
  };
}
