> Install the Mintlify authoring skill from the root of this docs repo with `npx skills add https://mintlify.com/docs`.
> The generated `.agents/skills/` files are local tooling artifacts for this repository and should not be treated as the source of truth for the docs site.

# Documentation project instructions

## About this project

- This is Sherlock's public documentation site built on [Mintlify](https://mintlify.com)
- Pages are MDX files with YAML frontmatter
- Site configuration lives in `docs.json`
- Sherlock-specific visual overrides live in `style.css`
- Run `mint dev` to preview locally
- Run `mint broken-links` to check links before larger docs changes

## Terminology

- Use "workspace" for a Sherlock research container
- Use "artifact" for a saved investigation output or report
- Use "investigation run" or "run" for AI analysis execution
- Use "provider" for OpenAI, Gemini, Anthropic, or OpenRouter
- Use "browser-local" instead of vague terms like "stored safely"
- Do not describe server-side storage unless the current product behavior actually does that

## Style preferences

- Use active voice and second person ("you")
- Keep sentences concise; one idea per sentence
- Use sentence case for headings
- Bold for UI elements: Click **Settings**
- Code formatting for file names, commands, paths, and code references
- Prefer practical setup and task flow over marketing copy
- Document the current product behavior, not roadmap or aspirational behavior
- When describing privacy or persistence, stay aligned with Sherlock's browser-local model

## Content boundaries

- Focus on the public Sherlock app and deployment/documentation workflows
- Do not invent features, providers, or admin surfaces that are not shipped
- Keep app behavior aligned with the main Sherlock repository docs when they overlap
