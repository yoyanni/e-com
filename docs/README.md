# Documentation

Pick a doc by what you're trying to do.

| Doc | Read it when you want to… |
| --- | --- |
| [getting-started.md](getting-started.md) | set up the project locally, run it, or look up a root npm script |
| [architecture.md](architecture.md) | understand how the workspaces, backend modules and frontend data paths fit together |
| [api.md](api.md) | call or change a backend endpoint, or a Next.js `/api/*` route handler |
| [auth.md](auth.md) | change login, tokens, cookies, roles or route protection |
| [data-model.md](data-model.md) | change an entity, write a migration, or understand what the seed does |
| [frontend.md](frontend.md) | add a page, change data fetching or caching, or work with the query hooks |
| [configuration.md](configuration.md) | set or add an environment variable |
| [testing.md](testing.md) | run, write or debug unit, e2e or Playwright tests |
| [deployment.md](deployment.md) | ship the frontend to Vercel or the backend to Render |
| [issues.md](issues.md) | find a known bug or gap to fix |
| [decisions/](decisions/README.md) | find out why something is built the way it is |

## Rules for these docs

- Change a doc in the same commit as the code it describes.
- Each fact lives in one doc. Other docs link to it instead of repeating it.
- Docs describe the code as it is today. Bugs go in [issues.md](issues.md), and reasons go in [decisions/](decisions/README.md).
- When you fix an issue, delete its entry from `issues.md` in the same commit.
- Don't rewrite a decision record. Add a new one and mark the old one as superseded.
- Add every new doc to the table above and to the list in [`AGENTS.md`](../AGENTS.md).
