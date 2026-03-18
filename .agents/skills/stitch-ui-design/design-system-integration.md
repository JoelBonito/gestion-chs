# Design System Integration

> Rules for connecting Stitch mockup outputs to the project Design System document. Defines what to extract, how to map to tokens, and how to maintain consistency.

---

## Extraction Protocol

After generating mockups, extract these elements for the Design System:

### What to Extract

| Category | What to Look For | Maps To |
|----------|-----------------|---------|
| **Color** | Primary CTA color, background color, text colors, accent colors | Color tokens (primary, neutral, semantic) |
| **Typography** | Heading style (serif/sans/display), body style, weight hierarchy | Typography section (families, scale) |
| **Spacing** | Card padding, section gaps, element margins | Spacing tokens (base unit, scale) |
| **Geometry** | Border radius (sharp/rounded), edge treatment | Component tokens (radius, borders) |
| **Components** | Button styles, card patterns, input styles, navigation patterns | Component specifications |
| **Depth** | Shadow usage, layering, elevation patterns | Effects tokens (shadows, elevation) |

### What NOT to Extract

- Exact pixel measurements from mockups (they are approximations)
- Colors that appear only due to Stitch rendering artifacts
- Layout proportions (these come from the wireframe, not the mockup)
- Animation/motion (Stitch generates static screens)

---

## Token Mapping

Map visual elements from mockups to design tokens:

### Colors

| Mockup Element | Design Token | Example |
|----------------|-------------|---------|
| Primary CTA button background | `--color-primary-500` | `#e8590c` |
| Primary CTA hover (darken 10%) | `--color-primary-600` | `#d04f0a` |
| Light primary background | `--color-primary-50` | `#fff4ed` |
| Main background | `--color-bg-primary` | `#fafafa` |
| Card/surface background | `--color-bg-surface` | `#ffffff` |
| Primary heading text | `--color-text-primary` | `#2d3436` |
| Secondary/body text | `--color-text-secondary` | `#636e72` |
| Success indicator | `--color-success` | Derive from mockup green |
| Error/danger indicator | `--color-error` | Derive from mockup red |

### Typography

| Mockup Element | Design Token | Example |
|----------------|-------------|---------|
| Headline font | Typography > Families > Headlines | DM Sans |
| Body text font | Typography > Families > Body | Inter |
| Headline weight | Typography > Scale > H1-H4 weight | 700 (Bold) |
| Body weight | Typography > Scale > body weight | 400 (Regular) |

### Geometry

| Mockup Element | Design Token | Example |
|----------------|-------------|---------|
| Card border radius | `--radius-card` | `2px` (sharp) or `16px` (soft) |
| Button border radius | `--radius-button` | `2px` or `8px` |
| Input border radius | `--radius-input` | Match button radius |
| Overall geometry category | Design Principles > Geometry | "Sharp/Geometric" |

---

## Consistency Rules

### 1. Design System is Source of Truth

Once the Design System document is written (Phase 7 in `/define`), it becomes the canonical reference. Mockups are **informational input**, not the final authority.

```
Hierarchy:
1. Design System document (source of truth)
2. Stitch mockups (visual reference)
3. Implementation code (must match Design System)
```

### 2. One Direction of Derivation

```
Mockups -> inform -> Design System -> guides -> Implementation
                                   ^
                                   |
                            NOT: Implementation -> changes -> Design System
                            NOT: Mockups -> directly guide -> Implementation
```

### 3. Reconciliation Rules

When mockups and Design System tokens conflict:

| Scenario | Resolution |
|----------|-----------|
| Mockup shows different shade of primary color | Use Design System token value |
| Mockup has inconsistent border radius | Use Design System geometry rule |
| Mockup introduces new color not in tokens | Evaluate: add to Design System or treat as rendering artifact |
| Mockup typography differs from spec | Use Design System font spec |

---

## Feedback Loop

If the Design System tokens produce results that look significantly different from the approved mockups, follow this process:

### When to Trigger

- Implementation looks "off" compared to approved mockups
- Design System tokens don't capture the visual identity established by mockups
- Stakeholder feedback indicates the implementation doesn't match the vision

### Process

1. **Identify the gap:** Which specific tokens or rules are causing the discrepancy?
2. **Update Design System:** Adjust tokens to better match the approved visual direction
3. **Regenerate key mockups** (optional): If the Design System changed significantly, regenerate 1-2 key screens with updated prompts to verify alignment
4. **Document the change:** Note the Design System revision in the changelog

### When NOT to Trigger

- Minor rendering differences (Stitch approximations are imprecise)
- Differences in spacing (wireframes define spacing, not mockups)
- Animation/motion (mockups are static)
- Responsive behavior (mockups show single viewport)

---

## Integration with `/define` Workflow

In the `/define` workflow, the integration follows this sequence:

```
Phase 3 (UX Concept) -> Wireframes defined
Phase 3.5 (Visual Mockups) -> Stitch generates mockups from wireframes
Phase 7 (Design System) -> @frontend-specialist reads mockups + wireframes
                           -> Extracts visual direction
                           -> Creates formal Design System tokens
                           -> Design System document = Source of Truth
```

### What `@frontend-specialist` Should Do in Phase 7

1. Read `03.5-visual-mockups.md` for visual reference
2. Read the "Insights for Design System" section
3. Apply extraction protocol from this document
4. Create Design System tokens that formalize the visual direction
5. Cross-check tokens against `@frontend-specialist` anti-cliche rules
6. Document any deviations from mockups with justification

---

## Integration with `/ui-ux-pro-max` Workflow

In the `/ui-ux-pro-max` workflow, integration is reversed:

```
Step 2: Generate Design System (from database)
Step 2b: Persist Design System
Step 2c: Visual Preview with Stitch -> Generates mockups FROM Design System tokens
                                    -> Validates tokens visually
                                    -> If mismatch: adjust tokens, regenerate
```

### What to Include in Stitch Prompts (Step 2c)

When generating from an existing Design System, embed the tokens directly:

```
"... Color palette: primary [TOKEN_VALUE], background [TOKEN_VALUE], text [TOKEN_VALUE].
Typography: [HEADING_FONT] for headings, [BODY_FONT] for body.
Geometry: [RADIUS]px border radius, [GEOMETRY_STYLE] edges. ..."
```

This ensures mockups validate the actual token values, not abstract descriptions.
