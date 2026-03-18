# Validation Checklist for Stitch-Generated Screens

> Quality gate for visual mockups before they are approved and used downstream by the Design System and implementation phases.

---

## 1. Screen Coverage

| Check | Pass | Fail |
|-------|------|------|
| All screens from UX Concept Section 4 have at least one mockup | Every screen listed has a corresponding Stitch screen ID | Missing screens without justification |
| Key screens have both MOBILE and DESKTOP variants | Landing, Dashboard, primary flow screens have both | Key screen exists only in one device type |
| Critical states are generated | Success state for all; Empty state for user-content screens | Only success state for screens with user-generated content |
| Screen count matches UX Concept | Generated count >= UX Concept screen count | Significant screens missing |

### Coverage Matrix Template

| UX Concept Screen | MOBILE | DESKTOP | Success | Empty | Error | Notes |
|-------------------|--------|---------|---------|-------|-------|-------|
| [Screen Name] | [ID] | [ID] | Yes | Yes/N/A | N/A | |

---

## 2. Visual Quality

| Check | Pass | Fail |
|-------|------|------|
| **Purple Ban** | No purple, violet, indigo, or magenta as primary/accent color | Any shade of purple used as brand color |
| **Safe Harbor** | No standard hero split (50/50), no bento grid default, no mesh gradient, no glassmorphism | Layout looks like a Tailwind UI template |
| **Intentional Palette** | Colors match the direction specified in the prompt; palette is cohesive | Random or default blue+white+gray palette |
| **Visual Hierarchy** | Clear distinction between primary, secondary, and tertiary elements | Everything has the same visual weight |
| **Typography** | Headings and body text are clearly different; hierarchy is visible | Uniform text sizing throughout |
| **Geometry Consistency** | Border radius is consistent across all elements on the screen | Mixed sharp and rounded without intention |
| **Audience Fit** | Visual style matches the target audience from the Brief | Enterprise app looks like a gaming app (or vice versa) |
| **Readability** | Text appears legible against backgrounds | Low contrast text, text over busy backgrounds |

---

## 3. UX Alignment

| Check | Pass | Fail |
|-------|------|------|
| **Layout matches wireframe** | Spatial arrangement follows UX Concept layout description | Elements in completely different positions than wireframe |
| **Navigation matches IA** | Navigation pattern matches Information Architecture from UX Concept Section 2 | Different navigation pattern than specified |
| **Element priority preserved** | Primary elements are visually prominent; secondary elements are subordinate | Secondary elements overshadow primary ones |
| **Flow continuity** | Screen-to-screen transitions make visual sense (consistent nav, headers) | Each screen looks like a different app |
| **Entry/Exit points visible** | Navigation paths described in wireframe have visible UI affordances | Dead-end screens with no way to navigate |
| **States are realistic** | Success state shows realistic data; empty state has helpful guidance | Placeholder text like "Lorem ipsum" everywhere |

---

## 4. Documentation

| Check | Pass | Fail |
|-------|------|------|
| **Project ID recorded** | Stitch project ID is documented in the output file | No project ID, screens can't be found later |
| **Screen IDs recorded** | Every generated screen has its ID in the output table | Missing IDs for some screens |
| **Screen-to-wireframe mapping** | Each generated screen references its UX Concept section number | No traceability between mockup and wireframe |
| **Device type recorded** | Each screen entry specifies MOBILE or DESKTOP | Ambiguous device type |
| **Model recorded** | Each screen entry specifies GEMINI_3_PRO or GEMINI_3_FLASH | No model info |
| **Approval status tracked** | Each screen has Approved/Pending/Rejected status | No approval tracking |
| **Insights section filled** | "Insights for Design System" section has specific observations | Empty or generic insights section |

---

## Approval Flow

After validation:

1. **All checks pass:** Mark screens as "Approved" in the output document. Proceed to next phase.
2. **Minor issues (1-3 fails in Visual Quality):** Note issues, ask user if acceptable or if regeneration is needed.
3. **Major issues (fails in UX Alignment or Coverage):** Regenerate affected screens with revised prompts. Do not proceed until resolved.
4. **Documentation issues:** Fix documentation before proceeding. These are quick fixes, not regeneration blockers.

### User Approval Prompt

```markdown
## Visual Mockups Review

Generated [N] screens for [Project Name].

### Coverage: [X/Y] screens covered
[Coverage matrix]

### Visual Quality: [PASS/ISSUES]
[List any issues]

Please review and respond:
- **ok** — Approve all and continue
- **refine [screen]** — Regenerate specific screen with feedback
- **skip** — Skip visual mockups, proceed without them
- **cancel** — Stop the workflow

Which screens need attention?
```

---

## Quick Validation (Minimum Viable Check)

For fast iterations or prototyping, verify at minimum:

- [ ] All UX Concept screens have at least one mockup
- [ ] No purple as primary color
- [ ] Layout follows wireframe structure
- [ ] Project ID and screen IDs are documented
- [ ] User has seen and acknowledged the mockups
