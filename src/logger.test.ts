import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Logger } from "./logger";

const loadLoggerWithLevel = async (level: string) => {
	mock.module("./envvars.ts", () => {
		return { LOG_LEVEL: level, INPUT_DIR: "input", OUTPUT_DIR: "output" };
	});

	const loggerModule = await import("./logger");

	Logger.resetInstance();

	return loggerModule.Logger.instance;
};

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
});

afterEach(() => {
	mock.restore();
});

describe("Logger with LOG_LEVEL=ERROR", () => {
	let logger: Logger;

	beforeEach(async () => {
		logger = await loadLoggerWithLevel("ERROR");
	});

	it("should log only errors", () => {
		logger.error("This is an error");
		logger.warn("This is a warning");
		logger.info("This is info");
		logger.debug("This is debug");

		expect(consoleErrorMock).toHaveBeenCalledTimes(1);
		expect(consoleWarnMock).toHaveBeenCalledTimes(0);
		expect(consoleInfoMock).toHaveBeenCalledTimes(0);
		expect(consoleDebugMock).toHaveBeenCalledTimes(0);
	});

	it("formats the log message with [ERROR] prefix and date", () => {
		logger.error("Test error message");

		expect(consoleErrorMock).toHaveBeenCalledTimes(1);

		const loggedMsg = consoleErrorMock.mock.calls[0]?.[0];

		expect(loggedMsg).toMatch(
			/^\d{4}-\d{2}-\d{2}T.* - \[ERROR\]: Test error message$/,
		);
	});
});

describe("Logger with LOG_LEVEL=WARN", () => {
	let logger: Logger;

	beforeEach(async () => {
		logger = await loadLoggerWithLevel("WARN");
	});

	it("should log warnings and errors, but not info or debug", () => {
		logger.error("Error message");
		logger.warn("Warn message");
		logger.info("Info message");
		logger.debug("Debug message");

		expect(consoleErrorMock).toHaveBeenCalledTimes(1);
		expect(consoleWarnMock).toHaveBeenCalledTimes(1);
		expect(consoleInfoMock).toHaveBeenCalledTimes(0);
		expect(consoleDebugMock).toHaveBeenCalledTimes(0);
	});
});

describe("Logger with LOG_LEVEL=INFO", () => {
	let logger: Logger;

	beforeEach(async () => {
		logger = await loadLoggerWithLevel("INFO");
	});

	it("should log error, warn, and info, but not debug", () => {
		logger.error("Error message");
		logger.warn("Warn message");
		logger.info("Info message");
		logger.debug("Debug message");

		expect(consoleErrorMock).toHaveBeenCalledTimes(1);
		expect(consoleWarnMock).toHaveBeenCalledTimes(1);
		expect(consoleInfoMock).toHaveBeenCalledTimes(1);
		expect(consoleDebugMock).toHaveBeenCalledTimes(0);
	});
});

describe("Logger with LOG_LEVEL=DEBUG", () => {
	let logger: Logger;

	beforeEach(async () => {
		logger = await loadLoggerWithLevel("DEBUG");
	});

	it("should log error, warn, info, and debug", () => {
		logger.error("Error message");
		logger.warn("Warn message");
		logger.info("Info message");
		logger.debug("Debug message");

		expect(consoleErrorMock).toHaveBeenCalledTimes(1);
		expect(consoleWarnMock).toHaveBeenCalledTimes(1);
		expect(consoleInfoMock).toHaveBeenCalledTimes(1);
		expect(consoleDebugMock).toHaveBeenCalledTimes(1);
	});

	it("appends multiple message parts correctly", () => {
		logger.info("Part1", { hello: "world" }, 42);

		expect(consoleInfoMock).toHaveBeenCalledTimes(1);
		const loggedMsg = consoleInfoMock.mock.calls[0]?.[0];
		expect(loggedMsg).toMatch(
			/^\d{4}-\d{2}-\d{2}T.* - \[INFO\]: Part1 \[object Object\] 42$/,
		);
	});
});
