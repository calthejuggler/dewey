import type { ResponseFormatJSONSchema } from "openai/resources/shared";
import { openai, responseFormat, responseSchema } from "./openai/client";
import { SYSTEM_PROMPT } from "./prompts";
import type { BunFile } from "bun";

export const ask = (
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

export const getNewMovieName = async (
  files: { name: string; file: BunFile }[],
) => {
  const completion = await ask(
    SYSTEM_PROMPT,
    JSON.stringify(files),
    responseFormat,
  );

  const json = JSON.parse(completion.choices[0].message.content ?? "{}");

  const { mainTitle } = responseSchema.parse(json);

  const title = files.find((file) => file.name === mainTitle.currentName);

  if (!title) {
    throw new Error(
      `OpenAI responded with a title name that doesn't exist: ${mainTitle.currentName}`,
    );
  }

  return { mainTitle, currentFile: title.file };
};
