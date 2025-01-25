import { LOG_LEVEL } from "./envvars";

enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
}

export class Logger {
	static #instance?: Logger;

	private _currentLogLevel: LogLevel;

	private constructor() {
		this._currentLogLevel = LogLevel[LOG_LEVEL as keyof typeof LogLevel];
	}

	private _shouldLog(logLevel: LogLevel) {
		return logLevel <= this._currentLogLevel;
	}

	public static get instance() {
		if (!Logger.#instance) {
			Logger.#instance = new Logger();
		}

		return Logger.#instance;
	}

	public static resetInstance() {
		Logger.#instance = undefined;
	}

	private _createMessage(logLevel: LogLevel, ...messages: unknown[]) {
		return `${new Date().toISOString()} - [${LogLevel[logLevel]}]: ${messages.join(" ")}`;
	}

	private _log(logLevel: LogLevel, ...messages: unknown[]) {
		if (!this._shouldLog(logLevel)) return;
		const message = this._createMessage(logLevel, ...messages);

		switch (logLevel) {
			case LogLevel.ERROR:
				console.error(message);
				break;
			case LogLevel.WARN:
				console.warn(message);
				break;
			case LogLevel.INFO:
				console.info(message);
				break;
			case LogLevel.DEBUG:
				console.debug(message);
				break;
		}
	}

	info(...messages: unknown[]) {
		this._log(LogLevel.INFO, ...messages);
	}

	error(...messages: unknown[]) {
		this._log(LogLevel.ERROR, ...messages);
	}

	warn(...messages: unknown[]) {
		this._log(LogLevel.WARN, ...messages);
	}

	debug(...messages: unknown[]) {
		this._log(LogLevel.DEBUG, ...messages);
	}
}
