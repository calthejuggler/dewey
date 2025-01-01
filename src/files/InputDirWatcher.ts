import fs from "node:fs";
import { Logger } from "../logger";
import { INPUT_DIR } from "../envvars";

const logger = Logger.instance;

export class InputDirWatcher {
	static #instance: InputDirWatcher;

	_interval = 10000;

	private constructor() {}

	public static get instance() {
		if (!InputDirWatcher.#instance) {
			InputDirWatcher.#instance = new InputDirWatcher();
		}

		return InputDirWatcher.#instance;
	}

	public async watch() {
		logger.info("Starting input dir watcher...");
		while (true) {
			logger.info("Checking input dir...");

			const mainContents = fs.readdirSync(INPUT_DIR);

			for (const dir of mainContents) {
				Dewey.instance.addDir(dir);
			}

			Dewey.instance.checkDirs();

			await new Promise((resolve) => setTimeout(resolve, this._interval));
		}
	}
}