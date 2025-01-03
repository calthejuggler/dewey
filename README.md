<div align="center"><img alt="The Dewey logo. An AI generated image of an owl sat atop a library book" src="https://github.com/user-attachments/assets/f92ba668-4485-4c2c-a12f-4f5911846db3" width="400px" /></div>

# Dewey

Hey there! Welcome to **Dewey**. My solution for renaming and organising movies
in my own home server. Maybe it can be a solution for you too!

> [!NOTE]
> This is a work in progress.

> [!CAUTION]
> **Dewey deletes files when moving them around! I am not responsible for any
> data loss!** (but if it happens, please let me know and I can try to make
> sure it never happens again?)
>
> Long story short - **Use at your own risk!**

**Dewey** is a file-organising tool that monitors an input directory for movie
files, retrieves movie name suggestions from ChatGPT, and
moves/renames the files to a structured output directory.

## Table of Contents

1. [Features](#features)  
2. [Installation](#installation)  
3. [Configuration](#configuration)  
4. [License](#license)  

## Features

- [x] **Watches an Input Directory** – Continuously scans for new movie files.  
- [x] **OpenAI Integration** – Uses a GPT-based service to generate or validate
    movie names.  
- [x]  **Automatic Renaming** – Moves and renames files to an organised output
    directory.  
- [x]  **Configurable Logging** – Supports different log levels (DEBUG, INFO, WARN,
    ERROR).  
- [x] **Docker Support** – Easily run Dewey in a Docker container.
- [x] **Docker Compose Support** – Easily run Dewey in a Docker Compose
- [ ] **Other AI Integrations** – Support for other AI services.
- [ ] **In Place Renaming** – Rename files in place instead of moving them.
- [ ] **Copy Only** – Copy files instead of moving them.

## Installation

### Option 1: Docker compose

```yaml
services:
  dewey:
    image: calthejuggler/dewey:latest
    environment:
      - OPENAI_API_KEY=YOUR_API_KEY
      - LOG_LEVEL=DEBUG
    volumes:
      - /path/to/input/dir:/input
      - /path/to/output/dir:/output
```

### Option 2: Docker

```bash
docker run -d \
  -v $(pwd)/input:/input \
  -v $(pwd)/output:/output \
  -e OPENAI_API_KEY=YOUR_API_KEY \
  -e LOG_LEVEL=INFO \
  calthejuggler/dewey:latest
```

### Option 2: Using Bun locally

1. **Install Bun** (follow the instructions at <https://bun.sh/>)
2. **Clone this repository**:

    ```bash
    git clone https://github.com/calthejuggler/dewey.git
    cd dewey
    ```

3. **Install dependencies**:

    ```bash
    bun install
    ```

4. **Run the application**:

    ```bash
    bun run src/index.ts
    ```

## Configuration

The application reads environment variables for certain configuration values:

- `INPUT_DIR`: Directory to watch for new movie files (defaults to "/input").
- `OUTPUT_DIR`: Directory to move and rename processed files (defaults to "/output").
- `STALE_TIME_MS`: Time in milliseconds after which a directory is considered
    “stale” and ready for renaming (defaults to 30000, i.e., 30 seconds).
- `LOG_LEVEL`: Controls the logging verbosity. Allowed values: "DEBUG", "INFO",
    "WARN", "ERROR" (defaults to "INFO").

## License

This project is licensed under the MIT License.

**Happy Movie Organising!**
For feedback, questions or feature requests, feel free to open an issue. Thank
you for using **Dewey**!
