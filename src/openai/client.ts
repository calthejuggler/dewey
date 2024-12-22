import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

export const openai = new OpenAI();

export const responseSchema = z.object({
  mainTitle: z.object({
    currentName: z.string(),
    newName: z.string(),
  }),
});

export const responseFormat = zodResponseFormat(responseSchema, "event");
