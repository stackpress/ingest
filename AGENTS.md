# AGENTS

## Scope

These instructions apply to the entire repository rooted at this directory.

## Working Directory

- Repository root: `/Users/cblanquera/server/projects/stackpress/ingest`
- Package workspace: `ingest/`
- Example workspaces: `examples/*`

## Package Manager

- This project uses `yarn`, not `npm`.
- Use `yarn` for installs, tests, builds, and workspace commands unless the user explicitly asks for something else.
- Do not replace documented `yarn` commands with `npm` equivalents.

## Node.js Requirement

- Use Node.js `22` or newer for all installs, builds, tests, and scripts.
- Prefer the newest available Node.js version when multiple `22.x` or newer versions are installed.
- If the resolved Node.js version is lower than `22`, stop and switch to a compatible binary before continuing.

## Node.js Resolution Order

When you need a Node.js binary, resolve it in this order and stop at the first successful result:

1. Check whether `nvm` is installed.
2. If `nvm` is installed, try to locate the `nvm` directory that contains installed Node.js versions.
3. If the `nvm` directory cannot be located directly, try to use `nvm` itself to resolve a `22+` Node.js version.
4. If `nvm` is not available or cannot produce a usable binary, check common OS-specific Node.js install paths.
5. If common paths do not contain Node.js `22+`, inspect environment variables for a Node.js binary path.
6. If no compatible Node.js binary is found after all checks, stop the task and ask the user for the Node.js location.

## Detailed Node.js Lookup Instructions

### 1. Check for `nvm`

- First check whether `nvm` is available in the shell.
- If it is available, prefer Node.js binaries managed by `nvm`.

### 2. If `nvm` is available, locate the `nvm` directory

Check these locations and hints first:

- `NVM_DIR`
- `$HOME/.nvm`
- `$XDG_CONFIG_HOME/nvm`
- `$HOME/.config/nvm`
- Any shell profile entry that exports `NVM_DIR`

Once the directory is found, look for installed Node.js binaries under:

- `<nvm-dir>/versions/node/`

Choose the highest installed version that is `>= 22`.

### 3. If the `nvm` directory cannot be located, use `nvm` directly

Try to resolve Node.js through `nvm` commands instead of hard-coded paths. Prefer flows equivalent to:

- listing installed versions
- selecting the newest installed `22+` version
- using `nvm which` for that version

Do not install a new Node.js version unless the user explicitly asks for that.

### 4. If `nvm` is unavailable, check common OS paths

Check common Node.js binary locations for the current OS.

macOS and Linux common paths:

- `/usr/local/bin/node`
- `/opt/homebrew/bin/node`
- `/opt/local/bin/node`
- `/usr/bin/node`

Windows common paths:

- `C:\Program Files\nodejs\node.exe`
- `C:\Program Files (x86)\nodejs\node.exe`

Version-check any discovered binary and only use it if it is `>= 22`.

### 5. If common paths fail, inspect environment variables

Check environment variables that may expose a Node.js binary or installation root, including:

- `PATH`
- `NODE_HOME`
- `NODE_BIN`
- `NVM_BIN`
- other obvious project or shell variables that directly point to a Node.js executable

Only accept the result if the resolved binary reports version `22` or newer.

### 6. If still unresolved

- Stop the task.
- Ask the user to provide the absolute path to a Node.js `22+` binary.

## Execution Rules

- Before running project scripts, confirm that `node --version` is `>= 22`.
- When a command must use a specific Node.js binary, prefer invoking that binary directly instead of relying on an ambiguous shell `PATH`.
- Do not downgrade Node.js for compatibility guesses.
- Do not continue with a lower Node.js version just because commands appear to work.

## Repository Commands

From the repository root:

- Install dependencies: `yarn install`
- Run tests: `yarn test`
- Build package: `yarn build`

From the package workspace:

- Install dependencies: `yarn --cwd ingest install`
- Run tests: `yarn --cwd ingest test`
- Build package: `yarn --cwd ingest build`
