import { Logger } from "../logger";
import type { Directory } from "./Directory";

const logger = Logger.instance;

export class MovieFile {
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
