import fs from "node:fs";
import path from "node:path";
import { checkHealth } from "./checkhealth";
import { INPUT_DIR, OUTPUT_DIR, STALE_TIME_MS } from "./envvars";
import { Logger } from "./logger";
import { getMovieName } from "./ask";

const logger = Logger.instance;

class MovieFile {
	private _parent: Directory;
	private _rawName: string;
	private _extension: string;

	constructor(parent: Directory, fileName: string) {
		logger.debug(`Creating MovieFile object for "${fileName}"`);
		this._parent = parent;
		this._rawName = fileName.split(".").slice(0, -1).join(".");
		this._extension = fileName.split(".").at(-1) ?? "";
		logger.debug(`Created MovieFile for "${fileName}"`);
	}

	public rename(newPath: string) {
		logger.debug(`Copying file: ${this.fileName} to ${newPath}`);
		fs.copyFileSync(path.join(this.path), newPath);
		logger.debug(`Copied file: ${this.fileName} to ${newPath}`);

		this._parent.deleteFile(this.fileName);
	}

	public get fileName() {
		return `${this._rawName}.${this._extension}`;
	}

	public get path() {
		return path.join(INPUT_DIR, this._parent.dirname, this.fileName);
	}

	public get locked() {
		return this._parent.isLocked;
	}
}

class Directory {
	private _dirname: string;
	private _path: string;
	private _files: Map<string, MovieFile> = new Map();
	private _locked = true;
	private _lastModified = 0;

	private _newName: string | null = null;
	private _newNameWithExtension: string | null = null;
	private _mainTitleName: string | null = null;

	private _outputInitialized = false;
	private _completed = false;

	constructor(public name: string) {
		logger.debug(`Creating Directory object for "${name}"`);
		this._dirname = name;
		this._path = path.join(INPUT_DIR, name);

		this.updateFiles();

		getMovieName(Array.from(this._files.keys())).then((res) => {
			this._newName = res.newNameWithoutExtension;
			this._newNameWithExtension = res.newMainTitleName;
			this._mainTitleName = res.oldMainTitleName;

			if (!this._files.has(res.oldMainTitleName)) {
				logger.error(
					`OpenAI has returned a main title name that doesn't exist in the input dir: ${res.oldMainTitleName}. Skipping dir...`,
				);

				return;
			}

			this._initializeOutput();
		});
	}

	private _initializeOutput() {
		if (this._newName === null) return;

		logger.info(`Initializing output dir for ${this._newName}`);

		try {
			logger.debug(`Creating output dir: ${this._newName}`);
			fs.mkdirSync(path.join(OUTPUT_DIR, this._newName));
			logger.debug(`Created extras dir: ${this._newName}`);
			fs.mkdirSync(path.join(OUTPUT_DIR, this._newName, "extras"));

			this._outputInitialized = true;
		} catch (error) {
			logger.error(
				`Error initializing output dir for ${this._newName}:`,
				error,
			);
		}
	}

	setModified(mtime: number) {
		if (mtime <= this._lastModified) {
			logger.debug(`Not updating modified time, mtime is ${mtime}`);
			return;
		}

		logger.debug(`Setting modified time for ${this._dirname} to ${mtime}`);
		this._lastModified = mtime;
	}

	public updateFiles() {
		logger.info(`Updating files for dir: ${this._dirname}`);

		logger.debug(`Reading files from ${this._path}`);
		const files = fs.readdirSync(this._path);
		logger.debug(`Read ${files.length} files from ${this._path}`);

		for (const file of files) {
			if (!file.includes(".")) {
				logger.warn(`File ${file} has no extension, ignoring...`);
				continue;
			}

			logger.debug(`Getting stats for file: ${file}`);
			const stats = fs.statSync(path.join(this._path, file));
			logger.debug(`Got stats for file: ${file}`);
			logger.debug("STATS", stats);

			if (stats.isDirectory()) {
				logger.warn(`Found directory: ${file}... Ignoring...`);
				continue;
			}

			this.setModified(stats.mtimeMs);

			this.addFile(file);
		}

		if (
			this._lastModified < Date.now() - STALE_TIME_MS &&
			this._outputInitialized &&
			!this._completed
		) {
			logger.info(`Starting rename process for ${this._newName}`);

			logger.debug(`Getting main title file: ${this._mainTitleName}`);
			const mainTitle = this._files.get(this._mainTitleName ?? "");

			if (mainTitle === undefined) {
				logger.error(`Could not find main title file: ${this._mainTitleName}`);

				return;
			}

			logger.debug(`Got main title file: ${this._mainTitleName}`);

			if (!this._newName) {
				logger.error("New name is null, undefined or empty. Skipping...");
				return;
			}

			if (!this._newNameWithExtension) {
				logger.error(
					"New name with extension is null, undefined or empty. Skipping...",
				);
				return;
			}

			logger.info(`Renaming main title file: ${mainTitle.fileName}`);
			mainTitle.rename(
				path.join(OUTPUT_DIR, this._newName, this._newNameWithExtension),
			);
			logger.info(`Renamed and moved main title file: ${mainTitle.fileName}`);

			logger.info("Moving extra files to extras dir");
			for (const file of this._files.values()) {
				logger.debug(`Renaming extra file: ${file.fileName}`);
				file.rename(
					path.join(OUTPUT_DIR, this._newName ?? "", "extras", file.fileName),
				);
				logger.debug(`Renamed and moved extra file: ${file.fileName}`);
			}

			logger.info(`Completed directory: ${this._dirname}`);
			this._completed = true;
		}
	}

	public addFile(fileName: string) {
		logger.debug(`Adding file: ${fileName}`);
		if (this._files.has(fileName)) {
			logger.debug(`File already exists, returning existing file: ${fileName}`);
			return this._files.get(fileName);
		}

		logger.debug(`Setting file: ${fileName}`);
		this._files.set(fileName, new MovieFile(this, fileName));
	}

	public deleteFile(fileName: string) {
		logger.debug(`Deleting file: ${fileName}`);
		if (!this._files.has(fileName)) {
			logger.warn(`Tried to delete file that doesn't exist: ${fileName}`);
		}

		this._files.delete(fileName);

		logger.debug(`Deleted file: ${fileName}`);
	}

	public get dirname() {
		return this._dirname;
	}

	public get isLocked() {
		return this._locked;
	}

	public get isCompleted() {
		return this._completed;
	}
}

class InputDirWatcher {
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

class Dewey {
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

async function main() {
	process.on("SIGINT", () => {
		logger.info("Received SIGINT, exiting...");

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
