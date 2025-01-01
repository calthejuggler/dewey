import type { ResponseFormatJSONSchema } from "openai/resources/shared";
import { Logger } from "./logger";
import { openai, responseFormat, responseSchema } from "./openai/client";
import { SYSTEM_PROMPT } from "./prompts";
import type path from "node:path";

const logger = Logger.instance;

const ask = (
	systemPrompt: string,
	userPrompt: string,
	format: ResponseFormatJSONSchema,
) =>
	openai.chat.completions.create({
		model: "gpt-4o-mini",
		response_format: format,
		messages: [
			{
				role: "system",
				content: systemPrompt,
			},
			{
				role: "user",
				content: userPrompt,
			},
		],
	});

export const getMovieName = async (
	files: { fileName: string; fileSize: number }[],
) => {
	logger.info("Asking OpenAI for movie name...", files);
	logger.debug(
		"Filenames:",
		files.map((file) => file.fileName),
	);

	const completion = await ask(
		SYSTEM_PROMPT,
		JSON.stringify(files),
		responseFormat,
	);

	let parsedContent: Record<string, unknown>;

	try {
		parsedContent = JSON.parse(completion.choices[0]?.message.content ?? "{}");
	} catch (error) {
		logger.error("Error parsing JSON:", error);
		parsedContent = {};
	}

	const result = responseSchema.safeParse(parsedContent);

	logger.debug("OpenAI Zod response:", JSON.stringify(result));

	if (!result.success) {
		logger.error("OpenAI Zod parsing failed:", result.error);
		return;
	}

	return result.data;
};
