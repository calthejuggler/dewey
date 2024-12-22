import { checkHealth } from "./checkhealth";
import { renameFilesInDirectory } from "./rename";

const checkForNewFiles = async () => {
  return false;
};

async function main() {
  try {
    checkHealth();
  } catch (error) {
    console.error("There was an error checking the environment:", error);
    return;
  }

  while (true) {
    if (await checkForNewFiles()) {
      await renameFilesInDirectory();
    }
  }
}

await main();
