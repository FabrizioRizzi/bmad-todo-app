# Design System - BMAD Todo App

**Version:** 1.0  
**Last Updated:** 2026-04-08  
**Status:** Foundation & Examples

---

## Overview

This document defines the design token system, component patterns, and visual coherence guidelines for the BMAD Todo App. It includes practical token usage examples to ensure consistent application across the codebase.

**Goal:** Prevent design system gaps by providing a single source of truth with clear, actionable examples for every token category.

---

## 1. Design Tokens

### 1.1 Color Palette

#### Primary Colors

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `primary-50` | `#f0f4ff` | Lightest backgrounds, hover states | Button hover, input focus ring |
| `primary-100` | `#e0e7ff` | Light backgrounds | Card backgrounds, sidebar |
| `primary-500` | `#3b82f6` | Primary action buttons | "Add Todo" button, links |
| `primary-600` | `#2563eb` | Active/pressed states | Button active, selected tabs |
| `primary-700` | `#1d4ed8` | Dark actions, hover enhancement | Secondary hover states |
| `primary-900` | `#1e3a8a` | Deep accents | Focus rings, borders |

**Token Usage Examples:**

```css
/* Button component - primary action */
.btn-primary {
  background-color: var(--color-primary-500);
  color: white;
  border: 2px solid var(--color-primary-600);
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-700);
}

.btn-primary:active {
  background-color: var(--color-primary-700);
}

.btn-primary:focus {
  outline: 2px solid var(--color-primary-900);
  outline-offset: 2px;
}
```

```tsx
// React component usage
export const PrimaryButton = ({ children, ...props }) => (
  <button
    className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 focus:outline-2 focus:outline-offset-2 focus:outline-primary-900"
    {...props}
  >
    {children}
  </button>
);
```

#### Neutral/Gray Scale

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `gray-50` | `#f9fafb` | Page background | Body background |
| `gray-100` | `#f3f4f6` | Secondary backgrounds | Card backgrounds, dividers |
| `gray-200` | `#e5e7eb` | Borders, dividers | Input borders, HR lines |
| `gray-500` | `#6b7280` | Secondary text | Helper text, captions |
| `gray-700` | `#374151` | Primary text | Body text, labels |
| `gray-900` | `#111827` | Darkest text | Headings, emphasis |

**Token Usage Examples:**

```css
/* Text hierarchy */
.text-primary {
  color: var(--color-gray-900);
  font-weight: 500;
}

.text-secondary {
  color: var(--color-gray-700);
}

.text-muted {
  color: var(--color-gray-500);
}

/* Borders */
.border-default {
  border: 1px solid var(--color-gray-200);
}

.border-dark {
  border: 1px solid var(--color-gray-300);
}

/* Backgrounds */
body {
  background-color: var(--color-gray-50);
  color: var(--color-gray-900);
}

.card {
  background-color: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-md);
}
```

#### Semantic Colors

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `success-500` | `#10b981` | Success states, positive actions | Completed todo checkmark |
| `warning-500` | `#f59e0b` | Warning, alerts | Unsaved changes indicator |
| `error-500` | `#ef4444` | Error states, destructive actions | Delete button, error messages |
| `info-500` | `#06b6d4` | Information, help | Info icons, tooltips |

**Token Usage Examples:**

```tsx
// Status indicator component
export const TodoItem = ({ todo }) => {
  const statusColor = todo.completed ? 'success-500' : 'gray-400';
  
  return (
    <div className="flex items-center gap-3">
      <div className={`bg-${statusColor} w-5 h-5 rounded-full`} />
      <span className={todo.completed ? 'line-through text-gray-500' : ''}>
        {todo.title}
      </span>
    </div>
  );
};
```

```css
/* Form validation feedback */
input.error {
  border-color: var(--color-error-500);
  background-color: rgba(239, 68, 68, 0.05);
}

input.error:focus {
  outline-color: var(--color-error-500);
}

.error-message {
  color: var(--color-error-500);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-1);
}

.success-message {
  color: var(--color-success-500);
}
```

### 1.2 Spacing Scale

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `spacing-0` | `0` | No space | Remove default margins |
| `spacing-1` | `0.25rem` (4px) | Tight spacing | Icon margins, badge padding |
| `spacing-2` | `0.5rem` (8px) | Compact spacing | Component padding |
| `spacing-3` | `0.75rem` (12px) | Comfortable spacing | Between elements |
| `spacing-4` | `1rem` (16px) | Standard padding | Card padding, button padding |
| `spacing-6` | `1.5rem` (24px) | Generous spacing | Section margins |
| `spacing-8` | `2rem` (32px) | Large spacing | Major sections |
| `spacing-12` | `3rem` (48px) | Extra large | Page sections |

**Token Usage Examples:**

```tsx
// Input field with label
export const FormField = ({ label, placeholder, value, onChange }) => (
  <div className="mb-spacing-4">
    <label className="block text-sm font-medium text-gray-700 mb-spacing-2">
      {label}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-spacing-3 py-spacing-2 border border-gray-200 rounded-md"
    />
  </div>
);
```

```css
/* Card component spacing */
.card {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.card-header {
  margin-bottom: var(--spacing-3);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-gray-200);
}

.card-body {
  margin-bottom: var(--spacing-2);
}

.card-footer {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-3);
  border-top: 1px solid var(--color-gray-200);
}

/* List item spacing */
.list-item {
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-100);
}

.list-item:last-child {
  border-bottom: none;
}

.list-item + .list-item {
  margin-top: var(--spacing-1);
}
```

### 1.3 Typography Scale

| Token | Size | Weight | Line Height | Usage | Example |
|-------|------|--------|-------------|-------|---------|
| `text-xs` | 12px | 400 | 1.5 | Small labels, badges | Form hints, timestamps |
| `text-sm` | 14px | 400 | 1.5 | Body text, secondary | Helper text, labels |
| `text-base` | 16px | 400 | 1.5 | Primary body text | Paragraph text, standard |
| `text-lg` | 18px | 500 | 1.6 | Emphasis, sections | Card titles, section heads |
| `text-xl` | 20px | 600 | 1.6 | Subheadings | Modal titles |
| `text-2xl` | 24px | 700 | 1.4 | Headings | Page titles |

**Token Usage Examples:**

```tsx
// Typography component hierarchy
export const TodoList = ({ todos, title }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-spacing-4">
      {title}
    </h2>
    <div className="space-y-spacing-2">
      {todos.map(todo => (
        <div key={todo.id} className="flex items-start gap-spacing-3">
          <input type="checkbox" className="mt-spacing-1" />
          <div>
            <p className="text-base text-gray-900">{todo.title}</p>
            {todo.description && (
              <p className="text-sm text-gray-500 mt-spacing-1">
                {todo.description}
              </p>
            )}
            <span className="text-xs text-gray-400 mt-spacing-2 inline-block">
              Created {todo.createdAt}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
```

```css
/* Typography utilities */
.heading-1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-gray-900);
}

.heading-2 {
  font-size: var(--font-size-xl);
  font-weight: 600;
  line-height: 1.6;
  color: var(--color-gray-900);
}

.heading-3 {
  font-size: var(--font-size-lg);
  font-weight: 500;
  line-height: 1.6;
  color: var(--color-gray-700);
}

.body-text {
  font-size: var(--font-size-base);
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-gray-900);
}

.caption {
  font-size: var(--font-size-xs);
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-gray-500);
}
```

### 1.4 Border Radius

| Token | Value | Usage | Example |
|-------|-------|-------|---------|
| `radius-sm` | 4px | Subtle rounding | Small buttons, badges |
| `radius-md` | 8px | Standard rounding | Cards, inputs, buttons |
| `radius-lg` | 12px | Generous rounding | Modals, larger cards |
| `radius-full` | 9999px | Pill shapes | Circular badges, avatars |

**Token Usage Examples:**

```tsx
// Button with appropriate radius
export const Button = ({ variant = 'primary', children }) => {
  const radiusClass = variant === 'small' ? 'rounded-sm' : 'rounded-md';
  
  return (
    <button className={`px-4 py-2 ${radiusClass} bg-primary-500`}>
      {children}
    </button>
  );
};

// Badge component
export const Badge = ({ label, variant = 'default' }) => (
  <span className="px-spacing-2 py-spacing-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
    {label}
  </span>
);

// Avatar component
export const Avatar = ({ initials }) => (
  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
    {initials}
  </div>
);
```

```css
/* Radius utilities */
.rounded-sm {
  border-radius: var(--radius-sm);
}

.rounded-md {
  border-radius: var(--radius-md);
}

.rounded-lg {
  border-radius: var(--radius-lg);
}

.rounded-full {
  border-radius: var(--radius-full);
}
```

### 1.5 Shadows & Elevation

| Token | Box Shadow | Usage | Example |
|-------|------------|-------|---------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation | Hover states |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Standard depth | Cards, floating elements |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Prominent elevation | Modals, dropdowns |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Maximum depth | Overlays, dialogs |

**Token Usage Examples:**

```tsx
// Card with shadow based on elevation
export const Card = ({ elevated = false, children }) => (
  <div 
    className={`
      bg-white rounded-lg p-4
      ${elevated ? 'shadow-lg' : 'shadow-md'}
    `}
  >
    {children}
  </div>
);

// Hover state with shadow elevation
export const TodoCard = ({ todo }) => (
  <div className="transition-all hover:shadow-lg hover:-translate-y-1">
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3>{todo.title}</h3>
    </div>
  </div>
);
```

```css
/* Shadow elevation system */
.elevation-1 {
  box-shadow: var(--shadow-sm);
}

.elevation-2 {
  box-shadow: var(--shadow-md);
}

.elevation-3 {
  box-shadow: var(--shadow-lg);
}

.elevation-4 {
  box-shadow: var(--shadow-xl);
}

/* Card elevation */
.card {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.2s ease-in-out;
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

### 1.6 Transitions & Animations

| Token | Duration | Easing | Usage | Example |
|-------|----------|--------|-------|---------|
| `duration-fast` | 150ms | ease-in-out | UI feedback | Hover states, focus |
| `duration-normal` | 300ms | ease-in-out | Standard transitions | State changes |
| `duration-slow` | 500ms | ease-in-out | Intentional animations | Page transitions |

**Token Usage Examples:**

```tsx
// Component with transitions
export const TodoItem = ({ todo, onToggle }) => (
  <div 
    className="transition-all duration-normal hover:shadow-md"
    onClick={() => onToggle(todo.id)}
  >
    <div className={`
      transform transition-transform duration-fast
      ${todo.completed ? 'scale-95 opacity-60' : 'scale-100 opacity-100'}
    `}>
      {todo.title}
    </div>
  </div>
);

// Skeleton loading with pulse
export const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded-md mb-spacing-2"></div>
    <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
  </div>
);
```

```css
/* Transition tokens */
:root {
  --transition-fast: all 150ms ease-in-out;
  --transition-normal: all 300ms ease-in-out;
  --transition-slow: all 500ms ease-in-out;
}

/* Button interaction transitions */
button {
  transition: var(--transition-fast);
}

button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

/* Fade animation */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fade-in var(--duration-normal) ease-in-out;
}

/* Slide animation */
@keyframes slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.slide-in {
  animation: slide-in var(--duration-normal) ease-in-out;
}
```

---

## 2. Component Patterns

### 2.1 Button Component

**Pattern:** Button component with variant, size, and state management.

```tsx
// Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
}: ButtonProps) => {
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700',
    ghost: 'text-primary-500 hover:bg-primary-50 active:bg-primary-100',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-spacing-2 py-spacing-1 text-sm rounded-sm',
    md: 'px-spacing-4 py-spacing-2 text-base rounded-md',
    lg: 'px-spacing-6 py-spacing-3 text-lg rounded-lg',
  };

  return (
    <button
      className={`
        font-medium transition-all duration-fast
        focus:outline-2 focus:outline-offset-2 focus:outline-primary-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
      `}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### 2.2 Input Field Component

**Pattern:** Accessible input with label, error states, and validation feedback.

```tsx
// FormField.tsx
import React, { useState } from 'react';

interface FormFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export const FormField = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  required,
}: FormFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mb-spacing-4">
      <label className="block text-sm font-medium text-gray-900 mb-spacing-1">
        {label}
        {required && <span className="text-error-500">*</span>}
      </label>
      
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full px-spacing-3 py-spacing-2
          border rounded-md
          transition-all duration-fast
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${
            error
              ? 'border-error-500 focus:ring-error-500'
              : 'border-gray-200 focus:ring-primary-500'
          }
        `}
      />
      
      {error && (
        <p className="text-error-500 text-sm mt-spacing-1">
          {error}
        </p>
      )}
    </div>
  );
};
```

### 2.3 Todo Item Component

**Pattern:** Complete todo display with completion state, edit, and delete actions.

```tsx
// TodoItem.tsx
import React from 'react';
import { Button } from './Button';

interface TodoItemProps {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const TodoItem = ({
  id,
  title,
  description,
  completed,
  createdAt,
  onToggle,
  onDelete,
  onEdit,
}: TodoItemProps) => {
  return (
    <div
      className={`
        flex items-start gap-spacing-3
        p-spacing-4 border border-gray-200 rounded-md
        transition-all duration-fast
        hover:shadow-md hover:border-gray-300
        ${completed ? 'bg-gray-50' : 'bg-white'}
      `}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(id)}
        className="mt-spacing-1 w-5 h-5 text-primary-500 rounded cursor-pointer"
        aria-label="Mark todo as complete"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={`
            text-base font-medium mb-spacing-1
            transition-all duration-fast
            ${completed ? 'line-through text-gray-500' : 'text-gray-900'}
          `}
        >
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 mb-spacing-2">
            {description}
          </p>
        )}
        
        <p className="text-xs text-gray-500">
          Created {new Date(createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-spacing-2 flex-shrink-0">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(id)}
          >
            Edit
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
```

---

## 3. Consistency Checklist

Before marking any component or feature as "done", verify:

### Visual Consistency
- [ ] Colors use only defined tokens (no hardcoded hex values)
- [ ] Spacing follows the spacing scale (no arbitrary px values)
- [ ] Typography uses defined sizes and weights
- [ ] Border radius uses defined tokens
- [ ] Shadows and elevation are consistent

### Interaction Consistency
- [ ] Hover states use transition tokens
- [ ] Focus states have visible indicators
- [ ] Disabled states are clearly indicated
- [ ] Loading states use animation tokens
- [ ] All buttons have consistent padding and sizing

### Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus rings are visible (outline or ring)
- [ ] Form labels associated with inputs
- [ ] Semantic HTML used appropriately
- [ ] ARIA attributes where needed

### Code Quality
- [ ] Token names used in code (not color values)
- [ ] Component props align with design system
- [ ] CSS follows BEM or component naming convention
- [ ] Tailwind classes used for utilities, not inline styles
- [ ] Variants clearly documented in component

---

## 4. Implementation Guide

### Adding a New Token

1. **Define in token system** (update root CSS variables or Tailwind config)
2. **Document in this file** with table entry and example
3. **Use in components** - never use raw values
4. **Test for consistency** across all component uses

### Creating a New Component

1. **Use existing tokens** for all visual properties
2. **Document with example code** in component patterns section
3. **Include all variants** (primary, secondary, etc. as applicable)
4. **Add to consistency checklist** if affecting multiple features

### Reviewing Code

Use the consistency checklist above. Key questions:
- Are design tokens used instead of hardcoded values?
- Is the component visually consistent with similar components?
- Are spacing, colors, and typography aligned with the system?

---

## 5. Token Reference CSS Variables

```css
:root {
  /* Colors */
  --color-primary-50: #f0f4ff;
  --color-primary-100: #e0e7ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-900: #1e3a8a;

  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;

  --color-success-500: #10b981;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  --color-info-500: #06b6d4;

  /* Spacing */
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;

  /* Typography */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.4;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  --transition-fast: all 150ms ease-in-out;
  --transition-normal: all 300ms ease-in-out;
  --transition-slow: all 500ms ease-in-out;
}
```

---

## Notes for AI Agents

**If you're an AI model building features in this app:**

1. **Always reference this document** before creating new components or styles
2. **Use the token examples** as templates for your implementations
3. **Run the consistency checklist** before considering work "done"
4. **Update this document** when introducing new tokens or patterns
5. **Avoid**: Hardcoded colors, spacing values, or font sizes
6. **Prefer**: Token names and the provided component patterns

This system exists to prevent the "design coherence gaps" noted in the AI Integration Log. By following these patterns consistently, we maintain a cohesive visual experience across the application.

---

**Document maintained by:** Design & Engineering Team  
**Last reviewed:** 2026-04-08  
**Next review:** After Epic 2 completion
