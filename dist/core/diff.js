"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTextDiff = createTextDiff;
exports.createFullDiff = createFullDiff;
const diff_1 = require("diff");
const normalizeForGroup = (value) => value.replace(/\s+/g, " ").trim();
const buildGroupKey = (original, modified) => `${normalizeForGroup(original)}→${normalizeForGroup(modified)}`;
function createTextDiff(original, edited) {
    const parts = (0, diff_1.diffWords)(original, edited);
    const result = [];
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
const createReversibleModel = (original, edited) => {
    const parts = (0, diff_1.diffWords)(original, edited);
    const tokens = [];
    const changes = [];
    let editedOffset = 0;
    let tokenIndex = 0;
    let changeIndex = 0;
    const createChange = (originalValue, modifiedValue, startIndex, endIndex) => {
        const id = `change_${changeIndex}`;
        changeIndex += 1;
        const groupKey = buildGroupKey(originalValue, modifiedValue);
        const change = {
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
    const pendingRemoved = [];
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
function createFullDiff(original, edited) {
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
