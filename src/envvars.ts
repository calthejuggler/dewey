export const INPUT_DIR = process.env.INPUT_DIR ?? "/input";
export const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "/output";

export const STALE_TIME_MS = process.env.STALE_TIME_MS
	? Number(process.env.STALE_TIME_MS)
	: 1000 * 30;

export default {
	INPUT_DIR,
	OUTPUT_DIR,
	STALE_TIME_MS,
};
