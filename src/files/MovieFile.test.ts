import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";

import fs, { rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import type { Directory } from "./Directory";
import { MovieFile } from "./MovieFile";

const warnMock = mock();

mock.module("../logger.ts", () => {
	return {
		Logger: {
			instance: {
				info: mock(),
				debug: mock(),
				warn: warnMock,
			},
		},
	};
});

mock.module("../ask.ts", () => ({
	getMovieName: mock(() => "Shaun of the Dead (2004)"),
}));

describe("MovieFile", () => {
	const dirname = "SHN_OF_TH_DEAD";
	const fileName = "SHN_OF_TH_DEAD_t00.mkv";
	const tempInputDir = fs.mkdtempSync(path.join(os.tmpdir(), "dewey-input-"));
	const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "dewey-output-"));

	const testContent = "Some test content";

	let mockDir: Directory;

	mock.module("../envvars.ts", () => {
		return {
			INPUT_DIR: tempInputDir,
			OUTPUT_DIR: tempOutputDir,
		};
	});

	afterAll(() => {
		rmSync(tempInputDir, { recursive: true });
	});

	beforeEach(() => {
		mockDir = {
			dirname,
			deleteFile: mock(),
		} as unknown as Directory;

		fs.mkdirSync(path.join(tempInputDir, dirname));

		fs.writeFileSync(path.join(tempInputDir, dirname, fileName), testContent);
	});

	afterEach(() => {
		const testFilePath = path.join(tempInputDir, dirname, fileName);

		if (fs.existsSync(testFilePath)) {
			fs.unlinkSync(testFilePath);
		}

		if (fs.existsSync(path.join(tempInputDir, dirname))) {
			fs.rmdirSync(path.join(tempInputDir, dirname));
		}
	});

	describe("new MovieFile()", () => {
		it("should create a new MovieFile object", async () => {
			const file = new MovieFile(mockDir, fileName);

			expect(file).toBeDefined();
			expect(file.fileSize).toEqual(testContent.length);
			expect(file.fileName).toEqual(fileName);
			expect(file.path).toEqual(path.join(tempInputDir, dirname, fileName));
			expect(file.rename).toBeDefined();
			expect(file.extension).toEqual("mkv");
		});
	});

	describe("rename()", () => {
		let movieFile: MovieFile;
		let newFilePath: string;

		beforeEach(() => {
			mockDir = {
				dirname,
				deleteFile: mock(),
			} as unknown as Directory;

			movieFile = new MovieFile(mockDir, fileName);
			newFilePath = path.join(tempOutputDir, "Renamed.File.mp4");
		});

		it("should copy and remove the original file, then call deleteFile on the parent", () => {
			expect(fs.existsSync(newFilePath)).toEqual(false);
			expect(fs.existsSync(path.join(tempInputDir, dirname, fileName))).toEqual(
				true,
			);

			movieFile.rename(newFilePath);

			expect(fs.existsSync(newFilePath)).toEqual(true);
			expect(fs.existsSync(movieFile.path)).toEqual(false);
			expect(mockDir.deleteFile).toHaveBeenCalledTimes(1);
			expect(mockDir.deleteFile).toHaveBeenCalledWith(fileName);
		});

		it("should warn and skip copying if the new file already exists", () => {
			expect(mockDir.deleteFile).not.toHaveBeenCalled();

			movieFile.rename(newFilePath);

			expect(mockDir.deleteFile).not.toHaveBeenCalled();
			expect(fs.existsSync(newFilePath)).toEqual(true);
			expect(fs.existsSync(path.join(tempInputDir, dirname, fileName))).toEqual(
				true,
			);
		});
	});

	describe("fileSize()", () => {
		let movieFile: MovieFile;

		beforeEach(() => {
			mockDir = {
				dirname,
			} as unknown as Directory;

			movieFile = new MovieFile(mockDir, fileName);
		});

		it("returns the file size", () => {
			expect(movieFile.fileSize).toEqual(testContent.length);
		});

		it("returns the file size after it changes", () => {
			const newContent = "New, longer, better and uncut content!";

			expect(movieFile.fileSize).toEqual(testContent.length);

			fs.writeFileSync(movieFile.path, newContent);

			expect(movieFile.fileSize).toEqual(newContent.length);
		});
	});
});
