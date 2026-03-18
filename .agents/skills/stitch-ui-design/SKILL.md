---
name: stitch-ui-design
description: Knowledge on how to use Stitch MCP to generate high-fidelity UI designs from textual wireframes. Integrates with UX Concept and Design System workflows.
allowed-tools: Read, Glob, Grep
---

# Stitch UI Design Skill

> **Purpose:** Generate high-fidelity visual mockups using Google Stitch MCP, bridging the gap between textual wireframes (Phase 3) and design system creation (Phase 7).
> **Core Principle:** Wireframes define WHAT; Stitch visualizes HOW it looks. Never generate without reading the UX Concept first.

---

## Selective Reading Rule (MANDATORY)

**Read REQUIRED files always, OPTIONAL only when needed:**

| File | Status | When to Read |
|------|--------|--------------|
| [prompt-engineering.md](prompt-engineering.md) | REQUIRED | Always read before generating any screen |
| [wireframe-to-prompt.md](wireframe-to-prompt.md) | REQUIRED | When converting UX Concept wireframes to Stitch prompts |
| [design-system-integration.md](design-system-integration.md) | Optional | When extracting design tokens from generated mockups |
| [validation-checklist.md](validation-checklist.md) | Optional | When validating generated screens before delivery |

> **prompt-engineering.md + wireframe-to-prompt.md = ALWAYS READ. Others = only when relevant.**

---

## Stitch MCP Tools Reference

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `mcp__stitch__create_project` | Create a new Stitch project container | Start of a new project or design session |
| `mcp__stitch__list_projects` | List all accessible projects | Find existing project to reuse |
| `mcp__stitch__get_project` | Get project details by name | Verify project exists and retrieve metadata |
| `mcp__stitch__list_screens` | List all screens in a project | Inventory existing screens before generating new ones |
| `mcp__stitch__get_screen` | Get screen details and output | Review a generated screen, check for suggestions |
| `mcp__stitch__generate_screen_from_text` | Generate a screen from a text prompt | Core generation tool — produce visual mockups |

### Tool Parameters Quick Reference

**generate_screen_from_text:**
- `projectId` (required): Project ID (numeric string)
- `prompt` (required): Detailed description of the screen to generate
- `deviceType` (optional): `MOBILE` (default) or `DESKTOP`
- `modelId` (optional): `GEMINI_3_FLASH` (default, faster) or `GEMINI_3_PRO` (higher quality)

> **GEMINI_3_PRO** for key screens (Dashboard, Landing, Onboarding). **GEMINI_3_FLASH** for secondary screens (Settings, Lists).

---

## Screen Generation Protocol

### Step 1: Read UX Concept
Read `docs/01-Planejamento/03-ux-concept.md` (fallback: `docs/planning/03-ux-concept.md`). Extract:
- Section 4: Screen Descriptions (wireframes)
- Section 1: UX Strategy (experience vision, principles)
- Section 2: Information Architecture (navigation pattern)

### Step 2: Read Brief for Brand Context
Read `docs/01-Planejamento/01-product-brief.md` (fallback: `docs/planning/01-product-brief.md`). Extract:
- Product name and category
- Target audience and their expectations
- Tone and personality

### Step 3: Create or Find Stitch Project
```
1. Call list_projects to check for existing project
2. If none found: call create_project with project title
3. Record the project ID for all subsequent operations
```

### Step 4: Convert Wireframes to Prompts
Load `wireframe-to-prompt.md` and follow the 7-step algorithm for each screen.

### Step 5: Generate Screens
For each screen from the UX Concept:
1. Generate MOBILE version first (primary)
2. Generate DESKTOP version for key screens
3. Use GEMINI_3_PRO for hero/dashboard/onboarding screens
4. Use GEMINI_3_FLASH for utility screens (settings, lists, forms)

### Step 6: Validate
Load `validation-checklist.md` and verify all generated screens.

### Step 7: Document
Create the output document with all screen IDs, project ID, and coverage mapping.

---

## When to Use This Skill

| Scenario | Use Stitch? | Notes |
|----------|-------------|-------|
| `/define` workflow Phase 3.5 | YES | After UX Concept, before Architecture |
| `/ui-ux-pro-max` Step 2c | YES | After design system, to validate tokens visually |
| Building new feature with wireframes | YES | Convert wireframes to visual reference |
| Quick prototype for stakeholder review | YES | Fast visual validation |
| Implementing code from existing designs | NO | Use the actual design files instead |
| Text-only documentation | NO | Stitch is for visual mockups |
| Bug fixing or debugging | NO | Not relevant |

---

## Rules (MANDATORY)

1. **Never generate without reading UX Concept first.** Stitch prompts must be derived from wireframe descriptions, not invented. If no UX Concept exists, create wireframes first.

2. **Apply anti-cliche rules from `@frontend-specialist`.** No default purple, no glassmorphism, no standard hero split, no generic SaaS palette. Cross-reference with `prompt-engineering.md` checklist.

3. **Generate both MOBILE and DESKTOP for key screens.** At minimum: Landing/Home, Dashboard, and primary user flow screens. Secondary screens can be MOBILE-only.

4. **Use GEMINI_3_PRO for key screens.** Dashboard, Landing, Onboarding, and any screen that defines the visual identity. Use GEMINI_3_FLASH for repetitive or utility screens.

5. **Present to user before proceeding.** After generating screens, show the user the results and ask for approval. Never silently proceed to the next phase.

6. **Document all IDs.** Record Stitch project ID and every screen ID in the output document. These are needed for future reference and iteration.

7. **Do not retry on timeout.** If `generate_screen_from_text` times out, the generation may still succeed server-side. Use `get_screen` to check later instead of re-generating.

---

## Integration Points

| Component | Relationship | Direction |
|-----------|-------------|-----------|
| `@ux-researcher` | Produces wireframes (Section 4 of UX Concept) | Input to this skill |
| `@frontend-specialist` | Consumes mockups for design system + implementation reference | Output from this skill |
| `frontend-design` skill | Provides anti-cliche rules and design principles | Rules applied to prompts |
| `/define` workflow | Phase 3.5 uses this skill for visual mockups | Workflow integration |
| `/ui-ux-pro-max` workflow | Step 2c uses this skill for visual preview | Workflow integration |
| Design System document | Mockups inform color, typography, and component decisions | Downstream reference |

---

## Output Document Template

When generating mockups, create:

**File:** `docs/01-Planejamento/03.5-visual-mockups.md` (or `docs/planning/03.5-visual-mockups.md`)

```markdown
# Visual Mockups: {Project Name}

## Metadata
- **Based on:** 03-ux-concept.md
- **Date:** {YYYY-MM-DD}
- **Stitch Project ID:** {project_id}
- **Model:** GEMINI_3_PRO / GEMINI_3_FLASH

## Generated Screens

| # | Screen Name | Device | Screen ID | Model | Status |
|---|------------|--------|-----------|-------|--------|
| 1 | [Name] | MOBILE | [id] | PRO | Approved/Pending |
| 2 | [Name] | DESKTOP | [id] | FLASH | Approved/Pending |

## Coverage

| UX Concept Screen | MOBILE | DESKTOP | States |
|-------------------|--------|---------|--------|
| [Screen 1] | Yes | Yes | Success |
| [Screen 2] | Yes | No | Success, Empty |

## Insights for Design System
- **Primary color observed:** [color from mockups]
- **Typography style:** [serif/sans/display from mockups]
- **Geometry:** [sharp/rounded/mixed from mockups]
- **Key patterns:** [notable UI patterns from mockups]
```

> **Note:** Always integrate the guidelines from `@frontend-specialist` to ensure generated designs are truly premium and unique. Load `prompt-engineering.md` before every generation session.
