import { beforeAll, afterAll, describe, expect, it } from "bun:test";
import { spawnSync } from "child_process";
import { readdir, rm, mkdir } from "node:fs/promises";
import path from "node:path";

const MOVIE_PREFIX = "SHAUN_OF_THE_DEAD_t";
const MOVIE_COUNT = 12;
const LARGEST_FILE_INDEX = 5;

const TEST_DIR = path.resolve("./test-dir");
const SCRIPT_PATH = path.resolve("./src/index.ts");

const padNumber = (num: number) => String(num).padStart(2, "0");
const numberToFileName = (num: number) =>
  `${MOVIE_PREFIX}${padNumber(num)}.mkv`;

process.env.INPUT_DIR = TEST_DIR;
process.env.OUTPUT_DIR = TEST_DIR;

describe("File renaming e2e test", () => {
  beforeAll(async () => {
    try {
      await rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {}

    await mkdir(TEST_DIR, { recursive: true });

    for (let i = 0; i <= MOVIE_COUNT; i++) {
      let randomSize = Math.floor(Math.random() * 9_900) + 100;

      if (i === LARGEST_FILE_INDEX) {
        randomSize = 500_000;
      }

      const content = "x".repeat(randomSize);

      const filename = numberToFileName(i);

      await Bun.write(path.join(TEST_DIR, filename), content);
    }
  });

  it("renames the largest file to an expected new name", async () => {
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

    // New file should exist
    expect(filesAfter.includes("Shaun of the Dead (2004).mkv")).toBe(true);
    // Old file should not exist
    expect(filesAfter.includes(numberToFileName(LARGEST_FILE_INDEX))).toBe(
      false,
    );
    // Other files should have been moved
    for (let i = 0; i < MOVIE_COUNT; i++) {
      expect(filesAfter.includes(numberToFileName(i))).toBe(false);
    }

    // extras directory should exist
    expect(filesAfter.includes("extras")).toBe(true);
    const extrasFiles = await readdir(path.join(TEST_DIR, "extras"));

    // extras directory should contain the other files
    for (let i = 0; i < MOVIE_COUNT; i++) {
      if (i === LARGEST_FILE_INDEX) continue;

      expect(extrasFiles.includes(numberToFileName(i))).toBe(true);
    }

    expect(extrasFiles.includes(numberToFileName(LARGEST_FILE_INDEX))).toBe(
      false,
    );
  });

  afterAll(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });
});
