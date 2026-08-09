import { loadEnv } from "./loadEnv";
import { ensureIndexes, INDEX_SUMMARY } from "../repositories/index";

/**
 * Creates every database index the backend relies on.
 * Run via: npm run db:index
 */
async function main(): Promise<void> {
  await ensureIndexes();
  console.log("Indexes ready:");
  INDEX_SUMMARY.forEach((line) => console.log(`  - ${line}`));
}

loadEnv();

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(
      "Index creation failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  });