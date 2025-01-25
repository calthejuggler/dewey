import fs from "node:fs";
import path from "node:path";
import { INPUT_DIR } from "../envvars";
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
		if (fs.existsSync(newPath)) {
			logger.warn(`File already exists, skipping: ${newPath}`);
			return;
		}

		fs.copyFileSync(path.join(this.path), newPath);
		fs.unlinkSync(path.join(this.path));
		logger.debug(`Copied file: ${this.fileName} to ${newPath}`);

		this._parent.deleteFile(this.fileName);
	}

	public get fileSize() {
		const stats = fs.statSync(this.path);

		return stats.size;
	}

	public get fileName() {
		return `${this._rawName}.${this._extension}`;
	}

	public get path() {
		return path.join(INPUT_DIR, this._parent.dirname, this.fileName);
	}

	public get extension() {
		return this._extension;
	}
}
