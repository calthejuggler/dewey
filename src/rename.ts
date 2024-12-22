import { readdir, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { openai, responseSchema, responseFormat } from "./openai/client";

export async function renameFilesInDirectory(dirPath: string): Promise<void> {
  const fileNames = await readdir(dirPath, { recursive: true });

  const files = fileNames.map((fileName) => {
    const fullPath = path.join(dirPath, fileName);
    const file = Bun.file(fullPath);

    return {
      name: fileName,
      size: file.size,
      filetype: file.type,
      file,
    };
  });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: responseFormat,
    messages: [
      {
        role: "system",
        content:
          "You are a digital librarian. It is your job to sort, name and categorize files into different folders, and name them as they should be named. You will be given a JSON string with data about a directory with films or tv episodes in it, but they may be misnamed. You will look at these items and figure out which on is most likely to be the main film (it will be the largest item, but if more than one file have the same size, choose the first one). You will then work out what the title of the main title should be. It should be in the form of `Name of Title (YEAR).mkv`, where the YEAR is the year of release. Please keep the original file extension at the end of the title. For example, if you are given `BCK_TO_FTR_II_07.mp4`, your best response would be `Back to the Future Part II (1989)`.",
      },
      {
        role: "user",
        content: JSON.stringify(files),
      },
    ],
  });

  try {
    const json = JSON.parse(completion.choices[0].message.content ?? "{}");

    const { mainTitle } = responseSchema.parse(json);

    const title = files.find((file) => file.name === mainTitle.currentName);
    if (!title) {
      throw new Error(
        `OpenAI responded with a title name that doesn't exist: ${mainTitle.currentName}`,
      );
    }

    // Copy file to new location
    const newFilePath = path.join(dirPath, mainTitle.newName);
    await Bun.write(newFilePath, title.file);

    // Delete old file
    const oldFilePath = path.join(dirPath, title.name);
    await unlink(oldFilePath);

    // Create extras directory
    await mkdir(path.join(dirPath, "extras"), { recursive: true });

    // Move non-main files to extras directory
    for (const file of files) {
      if (
        file.name === mainTitle.currentName ||
        file.name === mainTitle.newName
      )
        continue;

      await Bun.write(path.join(dirPath, "extras", file.name), file.file);
      await unlink(path.join(dirPath, file.name));
    }
  } catch (error) {
    console.error("There was an error parsing the OpenAI response:", error);
  }
}
