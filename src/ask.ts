import type { ResponseFormatJSONSchema } from "openai/resources/shared";
import { Logger } from "./logger";
import { openai, responseFormat, responseSchema } from "./openai/client";
import { SYSTEM_PROMPT } from "./prompts";

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
	logger.info("Asking OpenAI for movie name for files:", files);

	const completion = await ask(
		SYSTEM_PROMPT,
		JSON.stringify(files),
		responseFormat,
	);

	const json = JSON.parse(completion.choices[0]?.message.content ?? "{}");

	const parsed = responseSchema.parse(json);

	logger.debug("OpenAI response:", JSON.stringify(parsed));

	return parsed;
};
