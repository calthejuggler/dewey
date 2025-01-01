import { Directory } from "./files/Directory";
import { Logger } from "./logger";

const logger = Logger.instance;

export class Dewey {
	static #instance: Dewey;

	private _dirs: Map<string, Directory> = new Map();

	private constructor() {}

	public static get instance() {
		if (!Dewey.#instance) {
			Dewey.#instance = new Dewey();
		}

		return Dewey.#instance;
	}

	public addDir(dirname: string) {
		if (this._dirs.has(dirname)) {
			logger.debug(
				`Directory already exists, returning existing directory: ${dirname}`,
			);
			const dir = this._dirs.get(dirname);

			return dir;
		}

		logger.debug(`Setting directory in Dewey state: ${dirname}`);

		this._dirs.set(dirname, new Directory(dirname));

		return this._dirs.get(dirname);
	}

	public checkDirs() {
		logger.info("Checking Dewey state for completed directories...");
		for (const dir of this._dirs.values()) {
			if (dir.isCompleted) continue;
			logger.debug(`Updating files for directory: ${dir.name}`);
			dir.updateFiles();
		}
	}
}
