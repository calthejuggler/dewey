import type { ResponseFormatJSONSchema } from "openai/resources/shared";
import { Logger } from "./logger";
import { openai, responseFormat, responseSchema } from "./openai/client";
import { SYSTEM_PROMPT } from "./prompts";

const logger = Logger.instance;

const promptOpenAI = (
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

export const getMovieName = async (dirName: string) => {
	logger.info("Asking OpenAI for movie name...", dirName);

	const completion = await promptOpenAI(
		SYSTEM_PROMPT,
		JSON.stringify(dirName),
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
