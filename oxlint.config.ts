import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

export default defineConfig({
  extends: [core],
  rules: {
    "sort-keys": "off",
  },
  ignorePatterns: core.ignorePatterns,
});
