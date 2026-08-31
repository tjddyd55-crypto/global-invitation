/**
 * Idempotent visual template catalog sync from CODE registry seed.
 * Usage: npm run admin:sync-visual-templates [-- --dry-run]
 */
import { syncVisualTemplateCatalogFromRegistry } from '../src/lib/visualTemplates/catalogService';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const report = await syncVisualTemplateCatalogFromRegistry({ dryRun });
  console.log(JSON.stringify(report, null, 2));
  if (report.missingInDb.length > 0 || report.orphanInDb.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
