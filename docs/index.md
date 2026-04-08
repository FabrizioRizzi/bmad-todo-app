# BMAD Todo App - Documentation Index

Welcome! This folder contains all the design, architecture, and implementation guidance for the BMAD Todo App.

## 📖 Core References

### Design & UI
- **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - **START HERE FOR UI WORK**
  - Design tokens (colors, spacing, typography, shadows)
  - Component patterns with code examples
  - Consistency checklist for review
  - Token usage examples in CSS and React
  - Critical for AI agents to maintain visual coherence

### Architecture & Technical
- **[Architecture Decision Document](../_bmad-output/planning-artifacts/architecture.md)** - Complete system design
  - Tech stack and component choices
  - Data flow patterns and state management strategy
  - Performance constraints (API < 200ms, UI < 100ms, bundle < 200KB)
  - Undo/delete pattern and error handling approach
  - Monorepo structure and deployment model
- **project-context.md** - Project goals, constraints, and technical decisions (if created)

### AI Agent Guidance
- **[MODEL_SELECTION_STRATEGY.md](./MODEL_SELECTION_STRATEGY.md)** - **START HERE FOR SPRINT PLANNING**
  - Which model to use for each task type (Opus 4.6 vs. Auto vs. Human)
  - Decision criteria and cost-quality tradeoffs
  - Story assignment recommendations for current epics
  - ROI analysis and measurement framework
  - Rules of thumb for model selection

---

## 🎯 Quick Navigation

### For Feature Implementation
1. Read the relevant story specification
2. **Check [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for token usage**
3. Use the component patterns provided
4. Run the consistency checklist before marking complete

### For Architecture & Technical Questions
- Review the [Architecture Decision Document](../_bmad-output/planning-artifacts/architecture.md)
- Check constraints: Performance (API p95 < 200ms, UI < 100ms, bundle < 200KB)
- Understand the undo/delete pattern and error handling approach
- Check data flow expectations: server-driven mutations with pending states

### For Design Review
- Verify colors use only defined tokens
- Check spacing follows the scale
- Ensure typography is consistent
- Validate shadows and elevations

### For New Tokens
- Add to [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) with example
- Document CSS variable or Tailwind class
- Include usage example in both CSS and React

---

## 📋 Document Organization

- **`docs/`** (you are here) — Design system and technical guides
- **`_bmad-output/implementation-artifacts/`** — Story specs, implementations, readiness checklists, retrospectives
- **`_bmad-output/planning-artifacts/`** — Architecture, PRD, UX design, product briefs, research
- **`packages/frontend/` & `packages/backend/`** — Source code and package-specific docs

---

## ⚠️ Design System Coherence

From previous epics, design tokens were created but not applied consistently across components:

**Solution:** Always check [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) token examples when building components. Use the consistency checklist before marking work complete.

---

## 🚀 How AI Agents Should Use This

When implementing a feature:

```
1. Load the story spec from _bmad-output/implementation-artifacts/
2. Open docs/DESIGN_SYSTEM.md
3. For each component you build:
   - Find the matching token example
   - Use token names (not hardcoded values)
   - Apply the component pattern if available
4. Before marking complete:
   - Run the consistency checklist
   - Verify all colors, spacing, typography use tokens
   - Test focus, hover, active, and disabled states
```

---

## 📚 Additional Resources

- **../packages/frontend/** - React frontend source code
- **../packages/backend/** - Fastify backend source code
- **../e2e/** - End-to-end test specifications
- **../_bmad-output/** - All planning and implementation artifacts

---

**Last Updated:** 2026-04-08  
**Maintained by:** Design & Engineering Team  
**For questions about:** Design tokens, component patterns, or consistency issues
