---
name: stitch-ui-design
description: Knowledge on how to use Stitch MCP to generate high-fidelity UI designs from textual wireframes, extract production-ready code, and manage design systems. Integrates with UX Concept and Design System workflows.
allowed-tools: Read, Glob, Grep, mcp__stitch__create_project, mcp__stitch__list_projects, mcp__stitch__get_project, mcp__stitch__list_screens, mcp__stitch__get_screen, mcp__stitch__generate_screen_from_text, mcp__stitch__fetch_screen_code, mcp__stitch__fetch_screen_image, mcp__stitch__edit_screens, mcp__stitch__generate_variants, mcp__stitch__create_design_system, mcp__stitch__apply_design_system, mcp__stitch__list_design_systems, mcp__stitch__update_design_system
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
| [design-system-integration.md](design-system-integration.md) | Optional | When extracting design tokens or syncing Stitch Design Systems |
| [validation-checklist.md](validation-checklist.md) | Optional | When validating generated screens before delivery |
| [code-handoff.md](code-handoff.md) | Optional | When extracting code from approved mockups for implementation |

> **prompt-engineering.md + wireframe-to-prompt.md = ALWAYS READ. Others = only when relevant.**

---

## Stitch MCP Tools Reference

### Project Management

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `mcp__stitch__create_project` | Create a new Stitch project container | Start of a new project or design session |
| `mcp__stitch__list_projects` | List all accessible projects | Find existing project to reuse |
| `mcp__stitch__get_project` | Get project details by name | Verify project exists and retrieve metadata |

### Screen Generation & Retrieval

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `mcp__stitch__generate_screen_from_text` | Generate a screen from a text prompt | Core generation tool — produce visual mockups |
| `mcp__stitch__generate_variants` | Generate design variants of an existing screen | Explore alternative designs for stakeholder review |
| `mcp__stitch__list_screens` | List all screens in a project | Inventory existing screens before generating new ones |
| `mcp__stitch__get_screen` | Get screen details and output | Review a generated screen, check for suggestions |
| `mcp__stitch__fetch_screen_image` | Download the generated screen image | Save mockup PNG for offline reference or documentation |
| `mcp__stitch__fetch_screen_code` | **Extract the generated HTML/React code** | **CRITICAL — Get production-ready code from mockups** |
| `mcp__stitch__edit_screens` | Edit/refine an existing screen | Iterate on a screen without regenerating from scratch |

### Design System Management

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `mcp__stitch__create_design_system` | Create a design system in Stitch | After Design System doc is defined (Phase 7) |
| `mcp__stitch__list_design_systems` | List available design systems | Check for reusable DS before creating a new one |
| `mcp__stitch__apply_design_system` | Apply a design system to screens | Enforce visual consistency across all mockups |
| `mcp__stitch__update_design_system` | Update an existing design system | When design tokens change and DS needs sync |

### Tool Parameters Quick Reference

**generate_screen_from_text:**
- `projectId` (required): Project ID (numeric string)
- `prompt` (required): Detailed description of the screen to generate
- `deviceType` (optional): `MOBILE` (default) or `DESKTOP`
- `modelId` (optional): `GEMINI_3_FLASH` (default, faster) or `GEMINI_3_PRO` (higher quality)

**fetch_screen_code:**
- `projectId` (required): Project ID
- `screenId` (required): Screen ID from the generated screen

**fetch_screen_image:**
- `projectId` (required): Project ID
- `screenId` (required): Screen ID from the generated screen

**edit_screens:**
- `projectId` (required): Project ID
- `screenId` (required): Screen ID to edit
- `prompt` (required): Description of changes to apply

**generate_variants:**
- `projectId` (required): Project ID
- `screenId` (required): Screen ID to create variants from

**create_design_system:**
- `projectId` (required): Project ID
- `name` (required): Design system name
- `description` (optional): Description of the design system

**apply_design_system:**
- `projectId` (required): Project ID
- `designSystemId` (required): Design system ID to apply
- `screenId` (required): Screen to apply the design system to

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

### Step 8: Fetch Generated Code (CRITICAL)

> **This step is the difference between 30 minutes and 3 hours of implementation work.**
> Stitch generates production-ready HTML/React code alongside every mockup. Skipping this step means rewriting from scratch what already exists.

After screens are approved by the user:

1. **Create output directory:**
   ```
   mkdir -p docs/01-Planejamento/03.5-visual-mockups/generated-code
   ```
2. **For each approved screen**, call `fetch_screen_code(projectId, screenId)`
3. **Save each file** as `generated-code/{screenName}-{deviceType}.html`
   - Example: `generated-code/dashboard-mobile.html`, `generated-code/login-desktop.html`
4. **Add code links** to the output document (from Step 7) in a "Generated Code" section
5. **Handoff note:** Load `code-handoff.md` for the protocol on converting this code to React components

```markdown
## Generated Code

| Screen | Device | Code File | Status |
|--------|--------|-----------|--------|
| Dashboard | MOBILE | [dashboard-mobile.html](generated-code/dashboard-mobile.html) | Extracted |
| Dashboard | DESKTOP | [dashboard-desktop.html](generated-code/dashboard-desktop.html) | Extracted |
```

> **Rule:** Code is ~90% production-ready. Use it as the base for React components — add state, handlers, and TypeScript types. Do NOT rewrite from scratch.

### Step 9: Fetch Screen Images (Recommended)

Save mockup images for offline reference and documentation:

1. **For each approved screen**, call `fetch_screen_image(projectId, screenId)`
2. **Save images** in `docs/01-Planejamento/03.5-visual-mockups/images/`
3. Images serve as reference when Stitch MCP is unavailable in future sessions

> **Optional but recommended:** Images allow stakeholder review without Stitch access.

### Step 10: Iteration Protocol

When refinements are needed after initial generation:

1. **Partial changes** (color, text, small layout tweaks):
   - Use `edit_screens(projectId, screenId, prompt)` — describe only what to change
   - Do NOT regenerate the entire screen
2. **Design exploration** (stakeholder wants alternatives):
   - Use `generate_variants(projectId, screenId)` to create variations
   - Present variants to user for selection
3. **Design System enforcement** (ensure consistency across screens):
   - Use `create_design_system` or `list_design_systems` to manage DS in Stitch
   - Use `apply_design_system` to enforce DS on individual screens
   - Load `design-system-integration.md` for the full DS sync protocol
4. **After any iteration**, re-run `fetch_screen_code` for updated screens

> **Rule:** `edit_screens` for refinement, `generate_screen_from_text` for new screens, `generate_variants` for exploration. Never regenerate what can be edited.

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
| `@frontend-specialist` | Consumes mockups + **generated code** for design system + implementation | Output from this skill |
| `frontend-design` skill | Provides anti-cliche rules and design principles | Rules applied to prompts |
| `/define` workflow | Phase 3.5 uses this skill for visual mockups + code extraction | Workflow integration |
| `/ui-ux-pro-max` workflow | Step 2c uses this skill for visual preview + DS sync | Workflow integration |
| Design System document | Mockups inform tokens; **Stitch DS enforces consistency** | Bidirectional |
| Stitch Design System | Mirror of Design System doc inside Stitch platform | Sync via create/apply/update tools |

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

## Generated Code (Step 8)

| Screen | Device | Code File | Status |
|--------|--------|-----------|--------|
| [Name] | MOBILE | [generated-code/{name}-mobile.html](generated-code/{name}-mobile.html) | Extracted |
| [Name] | DESKTOP | [generated-code/{name}-desktop.html](generated-code/{name}-desktop.html) | Extracted |

> Code is ~90% production-ready. See `code-handoff.md` for the conversion protocol to React components.

## Stitch Design System (Step 10, if applicable)

- **DS ID:** [design_system_id]
- **DS Name:** [name]
- **Applied to screens:** [list of screen IDs]
```

> **Note:** Always integrate the guidelines from `@frontend-specialist` to ensure generated designs are truly premium and unique. Load `prompt-engineering.md` before every generation session.
