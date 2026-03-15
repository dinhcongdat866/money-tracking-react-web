import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Ban explicit `any` — use `unknown` instead
      "@typescript-eslint/no-explicit-any": "error",
      // Catch variables must be typed as unknown, not any
      "@typescript-eslint/use-unknown-in-catch-callback-variable": "error",
      // Disallow non-null assertions (the ! operator)
      "@typescript-eslint/no-non-null-assertion": "warn",
      // Disallow unused variables (catches dead code)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Require explicit return types on exported functions
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Disallow empty object types {}
      "@typescript-eslint/no-empty-object-type": "error",
    },
  },
];

export default eslintConfig;
