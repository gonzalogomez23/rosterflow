---
name: case-study
description: Generate case study content about Rosterflow for LinkedIn posts, portfolio, or documentation. Use when the user wants to write about technical decisions, AI integration patterns, or lessons learned.
user-invocable: true
allowed-tools: Read, Grep, Glob
---

# Case Study Content Generator

Generate compelling technical content about Rosterflow for the user's portfolio and LinkedIn.

## Process

1. **Ask what to focus on**: Recent feature, architectural decision, AI integration pattern, or lesson learned.
2. **Read the relevant code** to ground the content in real implementation details.
3. **Draft content** in the user's voice — technical but accessible, suitable for LinkedIn.

## Content structure

- **Hook**: Start with a relatable problem or surprising insight
- **Context**: What Rosterflow does and why this decision mattered
- **Implementation**: Specific technical details (not generic advice)
- **Result**: What improved, what was learned
- **Takeaway**: One actionable insight for the reader

## Tone guidelines

- First person, conversational
- Show code snippets when they illustrate a point
- Avoid buzzwords — be specific about what AI actually does
- Focus on practical value, not hype
- Keep LinkedIn posts under 1300 characters for optimal engagement

## Key project angles worth highlighting

- Hybrid AI + algorithmic approach (greedy engine + Claude optimization)
- Human-in-the-loop as a practical AI pattern (not full automation)
- Structured outputs with Zod validation for reliable AI responses
- Streaming UX for AI-powered features
- TypeScript strict mode + Supabase RLS for production safety
