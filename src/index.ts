import { checkHealth } from "./checkhealth";
import { InputDirWatcher } from "./files/InputDirWatcher";
import { Logger } from "./logger";

const logger = Logger.instance;

async function main() {
	process.on("SIGINT", () => {
		logger.info("Received SIGINT, exiting...");

		watcher.stopWatching();

		process.exit(0);
	});

	logger.info("Starting Dewey...");
	try {
		logger.info("Checking environment...");
		checkHealth();
		logger.info("Environment is healthy!");
	} catch (error) {
		logger.error("There was an error checking the environment:", error);
		return;
	}

	logger.info("Watching input dir...");
	const watcher = InputDirWatcher.instance;

	watcher.watch();
}

await main();
