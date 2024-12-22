import { beforeAll, afterAll, describe, expect, it } from "bun:test";
import { spawnSync } from "child_process";
import { readdir, rm, mkdir } from "node:fs/promises";
import path from "node:path";

const TEST_DIR = path.resolve("./test-dir");
const SCRIPT_PATH = path.resolve("./src/index.ts");

describe("File renaming e2e test", () => {
  beforeAll(async () => {
    try {
      await rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {}

    await mkdir(TEST_DIR, { recursive: true });

    const prefix = "SHAUN_OF_THE_DEAD_t";
    const count = 12;

    for (let i = 0; i <= count; i++) {
      let randomSize = Math.floor(Math.random() * 9_900) + 100;

      if (i === 5) {
        randomSize = 500_000;
      }

      const content = "x".repeat(randomSize);

      const filename = `${prefix}${String(i).padStart(2, "0")}.mkv`;

      await Bun.write(path.join(TEST_DIR, filename), content);
    }
  });

  it("renames the largest file to an expected new name", async () => {
    const fileNames = await readdir(TEST_DIR);
    const filesBefore = fileNames.map((file) =>
      Bun.file(path.join(TEST_DIR, file)),
    );

    const largestFile = filesBefore.reduce((acc, file) => {
      if (acc.size > file.size) return acc;

      return file;
    }, filesBefore[0]);

    const result = spawnSync("bun", [SCRIPT_PATH], {
      cwd: process.cwd(),
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
      },
    });

    expect(result.status).toBe(0);

    const filesAfter = await readdir(TEST_DIR);

    expect(filesAfter.includes("Shaun of the Dead (2004).mkv")).toBe(true);
    expect(filesAfter.includes("SHAUN_OF_THE_DEAD_t01.mkv")).toBe(true);
    expect(filesAfter.includes("SHAUN_OF_THE_DEAD_t05.mkv")).toBe(false);
  });

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });
});
