import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export const openai = new OpenAI();

export const responseSchema = z.object({
	oldMainTitleName: z.string(),
	newMainTitleName: z.string(),
	newNameWithoutExtension: z.string(),
});
export type MovieNameResponse = z.infer<typeof responseSchema>;

export const responseFormat = zodResponseFormat(responseSchema, "event");
