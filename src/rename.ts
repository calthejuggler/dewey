import { mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { getNewMovieName } from "./ask";
import { INPUT_DIR, OUTPUT_DIR } from "./envvars";

export async function renameFilesInDirectory(): Promise<void> {
	if (!INPUT_DIR) throw new Error("No INPUT_DIR");
	if (!OUTPUT_DIR) throw new Error("No OUTPUT_DIR");

	const fileNames = await readdir(INPUT_DIR, { recursive: true });

	const files = fileNames.map((fileName) => {
		if (!INPUT_DIR) throw new Error("No INPUT_DIR");
		const fullPath = path.join(INPUT_DIR, fileName);
		const file = Bun.file(fullPath);

		return {
			name: fileName,
			size: file.size,
			filetype: file.type,
			file,
		};
	});

	const { mainTitle, currentFile } = await getNewMovieName(files);

	try {
		// Copy file to new location
		const newFilePath = path.join(OUTPUT_DIR, mainTitle.newName);
		await Bun.write(newFilePath, currentFile);

		// Delete old file
		const oldFilePath = path.join(INPUT_DIR, mainTitle.currentName);
		await unlink(oldFilePath);

		// Create extras directory
		await mkdir(path.join(OUTPUT_DIR, "extras"), { recursive: true });

		// Move non-main files to extras directory
		for (const file of files) {
			if (
				file.name === mainTitle.currentName ||
				file.name === mainTitle.newName
			)
				continue;

			await Bun.write(path.join(OUTPUT_DIR, "extras", file.name), file.file);
			await unlink(path.join(INPUT_DIR, file.name));
		}
	} catch (error) {
		console.error("There was an error parsing the OpenAI response:", error);
	}
}
