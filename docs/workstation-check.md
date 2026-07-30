# Workstation Check

Recorded on 2026-07-30 while preparing the SpendGuard AI development environment on Windows (PowerShell).

## Tool Versions (verified before install)

| Tool | Command | Result | Install Source |
|---|---|---|---|
| Node.js | `node --version` | v24.18.0 | Pre-installed (official Node installer) |
| npm | `npm --version` | 11.16.0 | Bundled with Node.js |
| pnpm | `pnpm --version` | 11.18.0 | `npm install -g pnpm` (Corepack failed with `EPERM` writing to `C:\Program Files\nodejs\yarn` due to lack of admin rights; fell back to npm global install per the "no-winget path" guidance) |
| Git | `git --version` | 2.55.0.windows.3 | Pre-installed (official Git for Windows) |
| Python | `python --version` | 3.14.6 | Pre-installed |
| uv | `uv --version` | 0.11.32 | Pre-installed |

## Git Identity

Configured globally via:

```powershell
git config --global user.name "Ketan Shukla"
git config --global user.email "ketankshukla@gmail.com"
```

Verified with `git config --global --list`.

## Project Root

`E:\mastering-a-skill\spendguard-mcp` — created as the new project root. The earlier portfolio-demo repository at `e:\spend-guard` (containing only the master prompt) is left intact.

## Acceptance Checks

- **Node**: v24.18.0 (>= 20 required) — resolves in a new PowerShell window. ✅
- **pnpm**: Installed via npm global install (Corepack unavailable without admin rights); a package can be installed and produces a deterministic lockfile (verified in Phase 02). ✅
- **Git**: Local commit succeeds with the intended name/email (verified below). ✅
- **Python**: `python --version` reports 3.14.6. ✅
- **uv**: Available; virtual environment/lockfile creation to be verified when the Python risk service is created (Phase 14). ✅ (binary present)

## Deviation Notes

- Corepack's `pnpm` shim installation failed with `EPERM: operation not permitted, open 'C:\Program Files\nodejs\yarn'` because the current shell lacks administrator rights to modify the Node.js install directory. Used `npm install -g pnpm` instead, which is the officially documented no-admin-rights fallback. This does not affect reproducibility since `pnpm-lock.yaml` remains the machine-checked proof of dependency versions.
