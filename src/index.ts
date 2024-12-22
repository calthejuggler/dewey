import { readdir, unlink } from "node:fs/promises";
import { openai, responseFormat, responseSchema } from "./openai/client";

const fileNames = await readdir("./test-dir", {
  recursive: true,
});

fileNames.sort();

const files = fileNames.map((fileName) => {
  const file = Bun.file(`./test-dir/${fileName}`);

  return {
    name: fileName,
    size: file.size,
    filetype: file.type,
    file: file,
  };
});

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  response_format: responseFormat,
  messages: [
    {
      role: "system",
      content:
        "You are a digital librarian. It is your job to sort, name and categorize files into different folders, and name them as they should be named. You will be given a JSON string with data about a directory with films or tv episodes in it, but they may be misnamed. You will look at these items and figure out which on is most likely to be the main film (usually the first, largest item). You will then work out what the title of the main title should be. It should be in the form of `Name of Title (YEAR).mkv`, where the YEAR is the year of release. Please keep the original file extension at the end of the title. For example, if you are given `BCK_TO_FTR_II_07.mp4`, your best response would be `Back to the Future Part II (1989)`.",
    },
    { role: "user", content: JSON.stringify(files) },
  ],
});

try {
  const json = JSON.parse(completion.choices[0].message.content ?? "{}");
  const { mainTitle } = responseSchema.parse(json);

  const title = files.find((file) => file.name === mainTitle.currentName);

  if (title == null) {
    throw new Error(
      `OpenAI responded with a title name that doesn't exist: ${mainTitle.currentName}`,
    );
  }

  await Bun.write(`./test-dir/${mainTitle.newName}`, title.file);
  await unlink(`./test-dir/${title.name}`);
} catch (error) {
  console.error("There was an error parsing the openAI response:", error);
}
