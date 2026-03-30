---
paths:
  - "src/lib/ai/**"
  - "src/actions/**"
---

# AI integration rules

- Use `@anthropic-ai/sdk` — never call the REST API directly
- Initialize the Anthropic client in `src/lib/ai/client.ts` (server-only, single instance)
- All AI calls go through Server Actions — never expose the API key to the client
- Every AI response MUST be validated with a Zod schema before rendering
- Use structured outputs (`output_config.format: 'json'`) for guaranteed valid JSON
- Use `anthropic.messages.stream()` for roster generation to show progress
- Handle errors explicitly: `Anthropic.RateLimitError`, `Anthropic.APIError`
- Prompt templates live in `src/lib/ai/prompts/` as exported functions (not raw strings)
- Use XML tags in prompts to structure data: `<employees>`, `<shifts>`, `<constraints>`
- Default model: `claude-sonnet-4-6` for generation, `claude-haiku-4-5` for validation
- Include confidence scores (0–1) in AI responses for human-in-the-loop decisions
- Log token usage for cost tracking
