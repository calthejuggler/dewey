import { LOG_LEVEL } from "./envvars";

enum LogLevel {
	ERROR = "ERROR",
	WARN = "WARN",
	INFO = "INFO",
	DEBUG = "DEBUG",
}

export class Logger {
	static #instance: Logger;

	private constructor() {}

	public static get instance() {
		if (!Logger.#instance) {
			Logger.#instance = new Logger();
		}

		return Logger.#instance;
	}

	private _checkLogLevel(logLevel: LogLevel) {
		switch (logLevel) {
			// Always log errors
			case LogLevel.ERROR: {
				return true;
			}
			case LogLevel.WARN: {
				return (
					LOG_LEVEL === "DEBUG" || LOG_LEVEL === "INFO" || LOG_LEVEL === "WARN"
				);
			}
			case LogLevel.INFO: {
				return LOG_LEVEL === "DEBUG" || LOG_LEVEL === "INFO";
			}
			case LogLevel.DEBUG: {
				return LOG_LEVEL === "DEBUG";
			}
		}
	}

	private _createMessage(logLevel: LogLevel, ...messages: unknown[]) {
		return `${new Date().toISOString()} - [${logLevel}]: ${messages.join(" ")}`;
	}

	info(...messages: unknown[]) {
		if (!this._checkLogLevel(LogLevel.INFO)) return;
		console.log(this._createMessage(LogLevel.INFO, ...messages));
	}

	error(...messages: unknown[]) {
		if (!this._checkLogLevel(LogLevel.ERROR)) return;
		console.error(this._createMessage(LogLevel.ERROR, ...messages));
	}

	warn(...messages: unknown[]) {
		if (!this._checkLogLevel(LogLevel.WARN)) return;
		console.warn(this._createMessage(LogLevel.WARN, ...messages));
	}

	debug(...messages: unknown[]) {
		if (!this._checkLogLevel(LogLevel.DEBUG)) return;
		console.debug(this._createMessage(LogLevel.DEBUG, ...messages));
	}
}
