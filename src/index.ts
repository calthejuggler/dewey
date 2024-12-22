import { checkHealth } from "./checkhealth";
import { INPUT_DIR } from "./envvars";
import { renameFilesInDirectory } from "./rename";

async function main() {
  try {
    checkHealth();
  } catch (error) {
    console.error("There was an error checking the environment:", error);
    return;
  }

  // This will exist because checkhealth will throw otherwise
  await renameFilesInDirectory(INPUT_DIR!);
}

await main();
