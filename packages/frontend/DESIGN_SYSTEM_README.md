# Frontend Design System Reference

> 👉 **Main reference**: See `../../docs/DESIGN_SYSTEM.md` for complete design tokens, patterns, and examples.

This file is a quick anchor point for frontend developers. The canonical source is in the root `docs/` folder.

## ⚡ Quick Start

When building components in this frontend:

1. **Open** `../../docs/DESIGN_SYSTEM.md`
2. **Copy token examples** - Use CSS variables or Tailwind classes from the document
3. **Never hardcode** colors, spacing, or sizes
4. **Check the consistency checklist** before marking work complete

## 🎨 Token Quick Reference

### Colors
- Primary: `primary-50` through `primary-900`
- Neutral: `gray-50`, `gray-100`, `gray-200`, etc.
- Semantic: `success-500`, `error-500`, `warning-500`, `info-500`

### Spacing
- Scale: `spacing-0`, `spacing-1`, `spacing-2`, `spacing-3`, `spacing-4`, `spacing-6`, `spacing-8`, `spacing-12`
- Usage: `px-spacing-4`, `py-spacing-2`, `mb-spacing-3`, etc.

### Typography
- Sizes: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`
- Weights: `font-normal`, `font-medium`, `font-semibold`, `font-bold`

### Utilities
- Radius: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- Transitions: `transition-all duration-fast`, `duration-normal`, `duration-slow`

## 🔗 See Also

- `../../docs/index.md` - Full documentation index
- Component implementations in `./src/components/` - See existing patterns
- Tailwind config in `../../packages/frontend/` if using Tailwind

---

**For AI Agents:** Load `../../docs/DESIGN_SYSTEM.md` and review the token usage examples in each section. Use those patterns directly in your component code.
