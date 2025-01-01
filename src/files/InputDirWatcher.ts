import fs from "node:fs/promises";
import { Dewey } from "../dewey";
import { INPUT_DIR } from "../envvars";
import { Logger } from "../logger";

const logger = Logger.instance;

export class InputDirWatcher {
	static #instance: InputDirWatcher;

	private _interval = 10000;
	private _shouldWatch = true;

	private constructor() {}

	public static get instance() {
		if (!InputDirWatcher.#instance) {
			InputDirWatcher.#instance = new InputDirWatcher();
		}

		return InputDirWatcher.#instance;
	}

	public stopWatching() {
		logger.info("Stopping input dir watcher...");
		this._shouldWatch = false;
	}

	public async watch() {
		logger.info("Starting input dir watcher...");
		while (this._shouldWatch) {
			logger.info("Checking input dir...");

			const mainContents = await fs.readdir(INPUT_DIR);

			for (const dir of mainContents) {
				Dewey.instance.addDir(dir);
			}

			Dewey.instance.checkDirs();

			await new Promise((resolve) => setTimeout(resolve, this._interval));
		}
		logger.info("Stopped input dir watcher...");
	}
}
