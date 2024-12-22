import { renameFilesInDirectory } from "./rename";

async function main() {
  const dirPath = "./test-dir";

  await renameFilesInDirectory(dirPath);
}

await main();
