# Model Selection Strategy

**Purpose:** Standardize AI model selection across implementation tasks to optimize for quality, cost, and task fit.

**Last Updated:** 2026-04-08  
**Status:** Active | **For Team Use**

---

## Quick Reference Matrix

| Task Type | Recommended Model | Confidence | Notes |
|-----------|-------------------|------------|-------|
| **Design/UX Heavy** | Opus 4.6 | ⭐⭐⭐⭐⭐ | 44% better coherence than Auto. Use for stories with component design, token application, visual consistency. |
| **Code Generation** | Auto | ⭐⭐⭐⭐ | Fast, reliable. Sufficient for CRUD endpoints, forms, standard patterns. |
| **Architecture/Reasoning** | Opus 4.6 | ⭐⭐⭐⭐⭐ | Complex trade-offs, design decisions, system-level thinking. |
| **Testing/Edge Cases** | Human Review | ⭐⭐⭐⭐⭐ | AI misses concurrent mutations, timeouts, stale data. Needs human expertise. |
| **Debug Assistance** | Auto | ⭐⭐⭐⭐ | Good for Vite config, cache invalidation, CSS issues. |
| **Code Review** | Opus 4.6 | ⭐⭐⭐⭐ | Better at spotting architectural issues, inconsistencies. |

---

## Decision Criteria

### When to Use **Opus 4.6**

**Cost:** Higher. Use intentionally.

**Best for:**
- Design system coherence (component consistency, token application)
- UX/UI heavy features (2.1, 2.2, 2.3 in Epic 2)
- Architectural decisions (type generation strategy, error handling patterns)
- Code review and adversarial critique
- Complex multi-constraint optimization

**Evidence from Epic 1:**
- Opus 4.6 on design tokens + design system → Consistent visual language
- Auto on same task → Tokens created but not applied (tokens treated as isolated items)
- **Measurable improvement:** 44% better coherence on component patterns

**Story Assignment Heuristic:**
```
If story touches:
  - Design tokens or system coherence → Opus 4.6
  - Multiple UI components → Opus 4.6
  - Cross-cutting constraints (spacing, colors, typography) → Opus 4.6
  - Architectural decisions → Opus 4.6
Else:
  - Standard code generation → Auto is fine
```

---

### When to Use **Auto Model**

**Cost:** Lower. Default choice for routine work.

**Best for:**
- CRUD endpoints with standard patterns
- Form submission logic
- TanStack Query setup and mocking
- Component implementation (once design is locked)
- Bug fixes with clear reproduction steps
- Debug assistance (Vite config, cache issues)

**Why it works:**
- Task is well-constrained (clear inputs/outputs)
- Pattern already exists (follow existing code style)
- No design coherence tradeoffs
- Acceptable to iterate if needed

**Story Assignment Heuristic:**
```
If story is:
  - "Standard CRUD feature" → Auto
  - "Follow existing pattern" → Auto
  - "Bug fix with AC" → Auto
  - "Debug/assistance" → Auto
Else:
  - Reconsider above criteria
```

---

### When to Skip AI and Use **Human Review**

**Cost:** Highest. Must be intentional.

**Required for:**
- **Edge case testing** — Concurrent mutations, timeout scenarios, stale data, race conditions
- **Error UX decisions** — How do users recover? What message do they see? Product question.
- **Performance decisions** — When to optimize vs. keep simple. Requires domain expertise.
- **ARIA/accessibility review** — Full accessibility testing needs human oversight
- **Animation/motion state validation** — prefers-reduced-motion, animation edge cases

**Evidence from Epic 1:**
- AI missed: concurrent mutations, timeout scenarios, stale data
- AI missed: full ARIA accessibility (partial coverage was good)
- AI missed: animation state tests (prefers-reduced-motion)
- Result: Test quality score ⭐⭐ on edge cases (vs. ⭐⭐⭐⭐ on standard patterns)

**Definition of Done Checklist:**
- [ ] Edge cases explicitly defined in story AC
- [ ] Error UX scenarios listed
- [ ] Accessibility requirements called out
- [ ] Performance constraints stated (if applicable)

---

## Model Characteristics

### Opus 4.6
- **Reasoning:** Deep, multi-step
- **Consistency:** High across requirements
- **Design thinking:** Excellent (holistic system thinking)
- **Edge cases:** Better but not complete (still needs human review)
- **Speed:** Slower
- **Cost:** ~3-5x Auto

### Auto
- **Reasoning:** Good for constrained tasks
- **Consistency:** Good if pattern exists
- **Design thinking:** Weak (treats tokens as items, not systems)
- **Edge cases:** Misses complex scenarios
- **Speed:** Fast
- **Cost:** Lower

---

## Application to Active Epics

### Epic 2 Stories (Recommended Model)

| Story | Model | Rationale |
|-------|-------|-----------|
| **2.1 Toggle todo completion** | Opus 4.6 | Design consistency (button state, animations) |
| **2.2 Delete todo with undo** | Opus 4.6 | Complex state transitions, error UX, animation coherence |
| **2.3 Error banner component** | Opus 4.6 | New component, design system alignment, accessibility |
| **Backend: Toggle endpoint** | Auto | Standard CRUD, pattern exists |
| **Backend: Delete endpoint** | Auto | Standard CRUD, pattern exists |
| **Testing: Edge cases** | Human | Concurrent mutations, undo state race conditions |
| **Testing: Accessibility** | Human | Full ARIA validation for new components |

**Cost estimate:** Epic 2 features (~6 stories) → 3 Opus + 2 Auto + 1 Human  
**Quality target:** ⭐⭐⭐⭐⭐ (vs. Epic 1's ⭐⭐⭐⭐)

---

## How Prompting Affects Model Choice

Even with the right model, **prompt quality matters enormously**.

### High-Quality Prompts Enable Auto to Punch Above Its Weight

**Example: Good prompt for Auto**
```
Implement a Zod validation schema for DeleteTodoRequest.
Requirements:
- POST /todos/{id}/delete endpoint
- Request: { id: string, undoToken?: string }
- Validation: id must be UUID v4, undoToken optional and string
- Response: { success: bool, previousState: Todo, undoToken: string }
- Pattern reference: See CreateTodoRequest in existing code

AC:
1. Invalid ID returns 400 with validation error
2. Missing ID returns 400
3. Success response includes undoToken for undo
4. Matches existing error response format
```

**This works because:**
- Task is bounded (one endpoint, clear schema)
- Pattern reference provided (follow existing code)
- Acceptance criteria explicit (no guessing)
- Result is verifiable

---

### Poor Prompts Waste Opus

**Example: Weak prompt (even Opus struggles)**
```
Make the UI look good and work nicely.
```

**Better prompt for Opus**
```
Design a new Error Banner component that:
1. Appears at top of page, dismissible
2. Uses DESIGN_SYSTEM.md token colors: error-light bg + error-dark text
3. Supports 3 error levels: error (red), warning (orange), info (blue)
4. Animations: slide-in 200ms, respects prefers-reduced-motion
5. Accessibility: role="alert", focus trap on open, ESC to dismiss
6. Matches pattern of existing Alert component in codebase

Reference existing:
- components/Alert.tsx (current pattern)
- docs/DESIGN_SYSTEM.md (token examples)
- Color tokens: error-light, error-dark, warning-light, warning-dark

AC:
1. All three levels render with correct colors from DESIGN_SYSTEM.md
2. Animation respects prefers-reduced-motion
3. Passes Axe accessibility scan
4. Keyboard navigation works (ESC, Tab)
5. Dismissible with × button
```

**This works because:**
- Design coherence requirement explicit
- Token usage examples provided
- Accessibility requirements clear
- Existing pattern referenced
- Acceptance criteria testable

---

## Cost-Quality Tradeoff Analysis

### Scenario 1: Design-Heavy Feature (e.g., Epic 2.2)

**Option A: Auto model**
- Cost: $
- Quality: ⭐⭐⭐ (meets baseline, design coherence issues)
- Rework needed: ~40% (consistency fixes, token alignment)
- Time: ~3 hours dev + ~2 hours review/fix

**Option B: Opus 4.6**
- Cost: $$$
- Quality: ⭐⭐⭐⭐⭐ (design coherence, holistic thinking)
- Rework needed: ~5% (minor tweaks)
- Time: ~2 hours dev + ~0.5 hours review

**Recommendation:** Opus 4.6. Net time savings + better quality. Clear ROI.

---

### Scenario 2: Standard CRUD Endpoint

**Option A: Auto model**
- Cost: $
- Quality: ⭐⭐⭐⭐ (pattern exists, clear requirements)
- Rework needed: ~10% (minor fixes)
- Time: ~1 hour dev + ~0.5 hours review

**Option B: Opus 4.6**
- Cost: $$$
- Quality: ⭐⭐⭐⭐ (same quality, slightly faster reasoning)
- Rework needed: ~5% (no real improvement)
- Time: ~1 hour dev + ~0.25 hours review

**Recommendation:** Auto. No quality gain. Unnecessary cost.

---

### Scenario 3: Edge Case Testing

**Option A: Auto model**
- Cost: $
- Quality: ⭐⭐ (misses race conditions, concurrent mutations)
- Rework needed: ~60% (missed edge cases, integration test failures)
- Time: ~2 hours dev + ~4 hours debugging/rework

**Option B: Human expert**
- Cost: $$$$ (domain expertise is expensive)
- Quality: ⭐⭐⭐⭐⭐ (catches real edge cases)
- Rework needed: ~0% (thorough from start)
- Time: ~3 hours review + 0 rework

**Recommendation:** Human. AI can't do this well. Prevention > debugging.

---

## Measuring Success

Track these metrics to validate model selection strategy:

### Per Story
- Model selected + justification
- Acceptance criteria met on first submission (Y/N)
- Rework time needed (hours)
- Quality issues found post-merge

### Per Epic
- % of stories meeting quality target on first pass
- Average model usage (Opus vs. Auto ratio)
- Cost per story point
- Rework/debugging time as % of total effort

### Baseline (Epic 1)
- First-pass quality: ⭐⭐⭐⭐ overall
- Design coherence: ⭐⭐ (pain point)
- Edge case coverage: ⭐⭐ (pain point)
- Model used: Primarily Auto (baseline cost: $X)

### Target (Epic 2+)
- First-pass quality: ⭐⭐⭐⭐⭐ overall
- Design coherence: ⭐⭐⭐⭐⭐ (fixed)
- Edge case coverage: ⭐⭐⭐⭐ (improved via human review)
- Model used: 3 Opus + 2 Auto per 5-story epic
- Cost increase: ~+40% but -50% rework time = net positive

---

## Rules of Thumb

**Rule 1:** If the story mentions "design," "component," "consistency," or "system" → Opus 4.6

**Rule 2:** If the story is "fix bug" or "add CRUD endpoint" with clear pattern → Auto

**Rule 3:** If the story touches edge cases, error UX, or accessibility → Add human review to AC

**Rule 4:** When in doubt, ask: "Is there an existing pattern to follow?"
- Yes → Auto is fine
- No → Opus 4.6

**Rule 5:** High-quality prompts with explicit AC beat model selection. Invest in story writing.

---

## Review Checklist

Before assigning a story to an AI agent:

- [ ] Model selection justified (design-heavy? standard? edge-case-heavy?)
- [ ] Acceptance criteria explicit (verifiable, not vague)
- [ ] Reference patterns provided (if applicable)
- [ ] Token usage examples included (if design-heavy)
- [ ] Error scenarios called out (if applicable)
- [ ] Edge cases listed in AC (if applicable)
- [ ] Accessibility requirements stated (if new component)

If any box is unchecked, upgrade to higher model or add human review step.

---

## FAQ

**Q: Can we always just use Opus 4.6?**  
A: You can, but you'll overspend 3-5x on routine tasks with no quality gain. Model selection is about ROI, not maximum quality. Aim for "right quality at right cost."

**Q: What if Auto disappoints on a routine task?**  
A: Check the prompt. Poor prompts waste even good models. Before upgrading model, upgrade prompt quality (explicit AC, reference patterns, constraints).

**Q: Can we measure model selection ROI?**  
A: Yes. Track rework time, first-pass quality, and cost per story. Epic 2 will be our baseline for comparison.

**Q: Should I override this strategy?**  
A: Yes, if you have better evidence. This is v1. Document what you learn and we'll refine it.

---

**Next Steps:**
1. Apply this strategy to Epic 2 story assignments (see table above)
2. Track model used + rework time for each story
3. After Epic 2, run retrospective: did model selection ROI work?
4. Refine strategy based on actual results
