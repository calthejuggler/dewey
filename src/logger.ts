enum LogLevel {
	INFO = "INFO",
	ERROR = "ERROR",
	WARN = "WARN",
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

	createMessage(logLevel: LogLevel, ...messages: unknown[]) {
		return `${new Date().toISOString()} - [${logLevel}]: ${messages.join(" ")}`;
	}

	info(...messages: unknown[]) {
		console.log(this.createMessage(LogLevel.INFO, ...messages));
	}

	error(...messages: unknown[]) {
		console.error(this.createMessage(LogLevel.ERROR, ...messages));
	}

	warn(...messages: unknown[]) {
		console.warn(this.createMessage(LogLevel.WARN, ...messages));
	}

	debug(...messages: unknown[]) {
		console.debug(this.createMessage(LogLevel.DEBUG, ...messages));
	}
}
