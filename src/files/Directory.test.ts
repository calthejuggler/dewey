import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
} from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { MovieNameResponse } from "../openai/client";
import { Directory } from "./Directory";

const consoleErrorMock = mock();
const consoleWarnMock = mock();
const consoleInfoMock = mock();
const consoleDebugMock = mock();

beforeEach(() => {
	console.error = consoleErrorMock;
	console.warn = consoleWarnMock;
	console.info = consoleInfoMock;
	console.debug = consoleDebugMock;

	consoleErrorMock.mockReset();
	consoleWarnMock.mockReset();
	consoleInfoMock.mockReset();
	consoleDebugMock.mockReset();

	getMovieNameMock.mockReturnValue({
		newTitle: "Shaun of the Dead (2004)",
	});
});

const getMovieNameMock =
	mock<(dirname: string) => MovieNameResponse | undefined>();
mock.module("../ask.ts", () => {
	return {
		getMovieName: getMovieNameMock,
	};
});

let tempInputDir: string;
let tempOutputDir: string;

beforeAll(() => {
	tempInputDir = fs.mkdtempSync(path.join(os.tmpdir(), "dewey-input-"));
	tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "dewey-output-"));
});

afterAll(() => {
	fs.rmSync(tempInputDir, { recursive: true });
	fs.rmSync(tempOutputDir, { recursive: true });
});

afterEach(() => {
	mock.restore();
});

describe("Directory", () => {
	let dirName: string;
	let outputName: string;

	beforeEach(() => {
		dirName = "SHAUN_OF_TH_DEAD";
		outputName = "Shaun of the Dead (2004)";
	});

	describe("Directory.create()", () => {
		afterEach(() => {
			fs.rmdirSync(path.join(tempInputDir, dirName), { recursive: true });
			if (fs.existsSync(path.join(tempOutputDir, outputName))) {
				fs.rmdirSync(path.join(tempOutputDir, outputName), { recursive: true });
			}
		});

		it("should create a Directory instance and call getMovieName", async () => {
			mock.module("../envvars.ts", () => ({
				INPUT_DIR: tempInputDir,
				OUTPUT_DIR: tempOutputDir,
				STALE_TIME_MS: 500,
			}));

			const fullInputPath = path.join(tempInputDir, dirName);
			fs.mkdirSync(fullInputPath);

			const dir = await Directory.create(dirName);

			expect(dir).toBeDefined();
			expect(dir.dirname).toEqual(dirName);
			expect(getMovieNameMock).toHaveBeenCalledTimes(1);
			expect(getMovieNameMock).toHaveBeenCalledWith(dirName);

			const expectedOutputPath = path.join(tempOutputDir, outputName);
			expect(fs.existsSync(expectedOutputPath)).toEqual(true);
		});

		it("logs an error if getMovieName returns undefined, skipping output init", async () => {
			mock.module("../envvars.ts", () => ({
				INPUT_DIR: tempInputDir,
				OUTPUT_DIR: tempOutputDir,
				STALE_TIME_MS: 500,
			}));

			const fullInputPath = path.join(tempInputDir, dirName);
			fs.mkdirSync(fullInputPath);

			getMovieNameMock.mockReturnValueOnce(undefined);

			const dir = await Directory.create(dirName);
			expect(dir).toBeDefined();

			expect(consoleErrorMock).toHaveBeenCalledTimes(1);
			const outputPath = path.join(tempOutputDir, outputName);

			expect(fs.existsSync(outputPath)).toEqual(false);
		});
	});

	describe("updateFiles()", () => {
		let directoryInstance: Directory;
		let inputPath: string;

		beforeEach(async () => {
			mock.module("../envvars.ts", () => ({
				INPUT_DIR: tempInputDir,
				OUTPUT_DIR: tempOutputDir,
				STALE_TIME_MS: 100,
			}));

			inputPath = path.join(tempInputDir, dirName);
			fs.mkdirSync(inputPath);

			getMovieNameMock.mockReturnValue({
				newTitle: "Shaun of the Dead (2004)",
			});

			directoryInstance = await Directory.create(dirName);

			expect(
				fs.existsSync(path.join(tempOutputDir, "Shaun of the Dead (2004)")),
			).toEqual(true);
		});

		afterEach(() => {
			if (fs.existsSync(inputPath)) {
				fs.rmSync(inputPath, { recursive: true, force: true });
			}
		});

		it("should warn if a file has no extension", () => {
			const noExtFile = "no_extension_file";
			fs.writeFileSync(path.join(inputPath, noExtFile), "test content");

			directoryInstance.updateFiles();

			expect(consoleWarnMock).toHaveBeenCalledWith(
				expect.stringContaining(
					` - [WARN]: File ${noExtFile} has no extension, ignoring...`,
				),
			);
		});
	});

	describe("addFile()", () => {
		beforeEach(() => {
			mock.module("../envvars.ts", () => ({
				INPUT_DIR: tempInputDir,
				OUTPUT_DIR: tempOutputDir,
				STALE_TIME_MS: 500,
			}));
		});

		it("should add a file if it doesn't exist already", async () => {
			const inputPath = path.join(tempInputDir, dirName);
			fs.mkdirSync(inputPath);

			const dir = await Directory.create(dirName);
			dir.addFile("testfile.mp4");

			expect(consoleDebugMock).toHaveBeenCalledWith(
				expect.stringContaining("Adding file: testfile.mp4"),
			);

			dir.addFile("testfile.mp4");
			expect(consoleDebugMock).toHaveBeenCalledWith(
				expect.stringContaining(
					"File already exists, returning existing file: testfile.mp4",
				),
			);
		});
	});

	describe("deleteFile()", () => {
		beforeEach(() => {
			if (fs.existsSync(path.join(tempInputDir, dirName))) {
				fs.rmSync(path.join(tempInputDir, dirName), { recursive: true });
			}

			mock.module("../envvars.ts", () => ({
				INPUT_DIR: tempInputDir,
				OUTPUT_DIR: tempOutputDir,
				STALE_TIME_MS: 500,
			}));
		});

		it("should remove an existing file from the map", async () => {
			const inputPath = path.join(tempInputDir, dirName);
			fs.mkdirSync(inputPath);

			const dir = await Directory.create(dirName);
			dir.addFile("testfile.mp4");

			dir.deleteFile("testfile.mp4");
			expect(consoleDebugMock).toHaveBeenCalledWith(
				expect.stringContaining("Deleting file: testfile.mp4"),
			);
			expect(consoleDebugMock).toHaveBeenCalledWith(
				expect.stringContaining("Deleted file: testfile.mp4"),
			);
		});

		it("logs a warning if we try to delete a file not in the map", async () => {
			const inputPath = path.join(tempInputDir, dirName);
			fs.mkdirSync(inputPath);

			const dir = await Directory.create(dirName);
			dir.deleteFile("imaginary.mp4");

			expect(consoleWarnMock).toHaveBeenCalledWith(
				expect.stringContaining(
					"Tried to delete file that doesn't exist: imaginary.mp4",
				),
			);
		});
	});

	describe("setModified()", () => {
		beforeEach(() => {
			if (fs.existsSync(path.join(tempInputDir, dirName))) {
				fs.rmdirSync(path.join(tempInputDir, dirName), { recursive: true });
			}

			mock.module("../envvars.ts", () => ({
				INPUT_DIR: tempInputDir,
				OUTPUT_DIR: tempOutputDir,
				STALE_TIME_MS: 500,
			}));
		});

		it("should update _lastModified if mtime > current _lastModified", async () => {
			const inputPath = path.join(tempInputDir, dirName);
			fs.mkdirSync(inputPath);

			const dir = await Directory.create(dirName);
			dir.setModified(100);
			expect(consoleDebugMock).toHaveBeenCalledWith(
				expect.stringContaining(`Setting modified time for ${dirName} to 100`),
			);

			consoleDebugMock.mockReset();
			dir.setModified(50);
			expect(consoleDebugMock).toHaveBeenCalledWith(
				expect.stringContaining("Not updating modified time, mtime is 50"),
			);
		});
	});
});
