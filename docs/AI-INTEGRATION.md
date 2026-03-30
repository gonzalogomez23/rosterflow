# AI Integration Plan

## Goal

Augment the existing greedy roster engine with Claude API to produce higher-quality schedules, handle edge cases the algorithm misses, and enable human-in-the-loop corrections.

## Architecture

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  Generate UI  │────▶│ Server Action│────▶│ Claude API   │
│  (streaming)  │◀────│ src/actions/ │◀────│ (Sonnet 4.6) │
└──────────────┘     └─────────────┘     └──────────────┘
                           │
                    ┌──────▼──────┐
                    │ Roster Engine│  ← greedy algo as fallback
                    │ (pure TS)    │    and pre-processing
                    └─────────────┘
```

### Hybrid approach

1. **Pre-processing** (existing engine): Build slots, check constraints, generate a greedy draft
2. **AI optimization** (Claude): Receive the draft + raw data, improve assignments considering fairness, preferences, and patterns the greedy algorithm misses
3. **Validation** (Zod): Validate AI response against strict schema before rendering
4. **Human review**: Manager sees flagged assignments (low confidence), can override

## File structure (planned)

```
src/lib/ai/
├── client.ts          # Anthropic SDK singleton (server-only)
├── prompts/
│   ├── system.ts      # System prompt for roster generation
│   └── roster.ts      # User prompt builder (template literal function)
├── schemas/
│   └── roster.ts      # Zod schema for AI response validation
└── stream.ts          # Streaming helper for Server Actions
```

## Model strategy

| Task | Model | Why |
|------|-------|-----|
| Roster generation | Sonnet 4.6 | Best speed/quality balance for structured output |
| Conflict resolution | Opus 4.6 | Complex reasoning when multiple constraints conflict |
| Quick validation | Haiku 4.5 | Fast, cheap checks (availability, simple questions) |

## Prompt design

- XML tags to structure input: `<employees>`, `<shifts>`, `<constraints>`, `<draft_roster>`
- Ask for reasoning before final assignments (chain of thought)
- Request confidence scores (0–1) per assignment for human-in-the-loop triggers
- Use structured outputs (`output_config.format: 'json'`) for guaranteed valid JSON

## Streaming

Use `anthropic.messages.stream()` in a Server Action. The generate page shows real-time progress as the AI processes the roster.

## Human-in-the-loop

The key differentiating feature:

1. AI generates roster with confidence scores per assignment
2. Assignments with confidence < 0.8 or conflicts are **flagged**
3. Manager reviews flagged assignments, can swap employees or confirm
4. Corrections are logged in `roster_corrections` table for future prompt context

### New table (planned)

```sql
CREATE TABLE roster_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
  original_employee_id UUID REFERENCES employees(id),
  corrected_employee_id UUID REFERENCES employees(id),
  shift_id UUID REFERENCES shifts(id),
  assignment_date DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Cost estimation

For a typical business (20–50 employees, weekly rosters):

- Input: ~2k tokens per request (employee data + constraints + draft)
- Output: ~1k tokens (optimized roster + reasoning)
- **Sonnet 4.6**: ~$0.02 per roster generation
- With prompt caching (system prompt): ~$0.005 per generation

Monthly cost for daily generation: ~$0.15–$0.60

## Implementation phases

### Phase 1 — Foundation
- [ ] Install `@anthropic-ai/sdk`
- [ ] Create `src/lib/ai/client.ts` with server-only Anthropic client
- [ ] Build system prompt and user prompt templates
- [ ] Add Zod schema for AI roster response
- [ ] Wire up basic generation (no streaming yet)

### Phase 2 — Streaming & UX
- [ ] Add streaming to generation page
- [ ] Show progress indicators during AI processing
- [ ] Display confidence scores in roster table
- [ ] Highlight flagged assignments

### Phase 3 — Human-in-the-loop
- [ ] Create `roster_corrections` table
- [ ] Build review UI for flagged assignments
- [ ] Include past corrections in prompt context
- [ ] Track improvement metrics over time
