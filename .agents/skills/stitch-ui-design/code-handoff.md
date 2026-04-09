# Code Handoff Protocol

> How to extract production-ready code from Stitch mockups and convert it into React/Next.js components for implementation.

---

## When to Use This Document

- After Step 8 (Fetch Generated Code) in the Screen Generation Protocol
- When `@frontend-specialist` is ready to implement screens from approved mockups
- When converting Stitch HTML output to your project's component architecture

---

## Extraction Protocol

### 1. Fetch Code for All Approved Screens

```
For each approved screen in the mockups document:
1. Call fetch_screen_code(projectId, screenId)
2. Save to: docs/01-Planejamento/03.5-visual-mockups/generated-code/{screenName}-{device}.html
3. Record in the mockups document "Generated Code" section
```

### 2. Code Quality Assessment

Before converting, assess what Stitch generated:

| Aspect | Typical Quality | Action Needed |
|--------|----------------|---------------|
| HTML structure | 90% usable | Minor semantic adjustments |
| CSS/Tailwind classes | 85% usable | Align with project's design tokens |
| Layout | 90% accurate | Verify responsive behavior |
| Colors | 80% accurate | Replace with project's CSS variables |
| Typography | 85% accurate | Replace with project's font tokens |
| Icons | 50% usable | Replace placeholder SVGs with project's icon library |
| Images | Placeholder | Replace with actual assets |
| Interactivity | 0% | Add state, handlers, events from scratch |
| Accessibility | 40% | Add ARIA labels, keyboard nav, focus management |

---

## Conversion Protocol: HTML to React Component

### Step 1: Structural Extraction

From the fetched HTML:
1. Identify the main layout sections (header, sidebar, content, footer)
2. Map each section to a potential component boundary
3. Identify repeated patterns that should become reusable components

### Step 2: Component Decomposition

```
Stitch HTML (single file)
    ├── Layout wrapper → layout.tsx or page wrapper
    ├── Navigation → existing nav component or new one
    ├── Content sections → individual components
    │   ├── Stats row → StatsCards.tsx
    │   ├── Main content → TaskList.tsx / DataTable.tsx
    │   └── Sidebar → ActivityFeed.tsx
    └── Shared elements → extract to ui/ components
```

### Step 3: Token Alignment

Replace Stitch's inline values with project design tokens:

| Stitch Output | Replace With |
|---------------|-------------|
| `style="color: #e8590c"` | `className="text-primary"` or `style={{ color: 'var(--color-primary)' }}` |
| `style="border-radius: 2px"` | `className="rounded-sm"` (if matches token) |
| Hardcoded font families | Project's typography tokens |
| Inline padding/margins | Tailwind spacing utilities |

### Step 4: Add Interactivity

What Stitch cannot generate — you must add:

1. **State management:** useState, useContext, or server state (React Query)
2. **Event handlers:** onClick, onSubmit, onChange
3. **Form validation:** Zod schemas, form libraries
4. **Loading states:** Skeleton components, Suspense boundaries
5. **Error states:** Error boundaries, fallback UI
6. **Navigation:** Next.js Link, useRouter
7. **Data fetching:** Server Components async/await, or client-side React Query

### Step 5: Accessibility Pass

Stitch output lacks proper accessibility. Add:

- [ ] Semantic HTML tags (`<nav>`, `<main>`, `<section>`, `<article>`)
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation (tab order, Enter/Space handlers)
- [ ] Focus management (focus traps in modals, auto-focus)
- [ ] Alt text on images
- [ ] Color contrast verification (4.5:1 minimum)
- [ ] `prefers-reduced-motion` for animations

### Step 6: TypeScript Types

Add proper typing that Stitch HTML doesn't include:

```typescript
// Define props for extracted components
interface StatsCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
}

// Type data structures referenced in the UI
interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: Date;
  assignee: User;
}
```

---

## Handoff Checklist

Before marking code handoff as complete:

- [ ] All approved screens have extracted code files
- [ ] Code files are saved in `generated-code/` directory
- [ ] Mockups document has "Generated Code" section with links
- [ ] `@frontend-specialist` has been informed of available code base
- [ ] Component decomposition plan is documented (which components to extract)

---

## Anti-Patterns

- **Do NOT rewrite from scratch** what Stitch already generated — use it as the base
- **Do NOT copy CSS inline styles** — convert to design tokens/Tailwind
- **Do NOT keep placeholder content** — replace all "Lorem ipsum" with real copy
- **Do NOT skip the accessibility pass** — Stitch output is not accessible by default
- **Do NOT treat Stitch code as final** — it's a ~90% starting point, not the finished product
