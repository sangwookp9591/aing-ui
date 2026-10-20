import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_|^T$" }] } },
  // CLI 크기 측정기와 npm 실행 래퍼는 Node에서 바로 도는 CommonJS라 require가 맞다.
  { files: ["**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  globalIgnores([".next/**", "packages/core/dist/**", ".verify/**", "public/r/**", "next-env.d.ts", "cli/target/**"]),
]);
