# Prompt Engineering for Stitch

> Guide for constructing high-quality prompts that produce premium, unique UI mockups via Google Stitch MCP.

---

## Prompt Anatomy

Every Stitch prompt should follow this structure:

```
[SCREEN TYPE] + [VISUAL STYLE] + [COLOR DIRECTION] + [LAYOUT STRUCTURE] + [KEY ELEMENTS] + [MOOD] + [CONSTRAINTS]
```

| Segment | Purpose | Example |
|---------|---------|---------|
| Screen Type | What kind of screen | "Dashboard for a project management app" |
| Visual Style | Design language | "Clean minimalist with sharp geometric edges" |
| Color Direction | Palette intent | "Deep teal primary with warm amber accents on white" |
| Layout Structure | Spatial organization | "Left sidebar navigation, main content area with card grid" |
| Key Elements | Must-have components | "Stats cards at top, task list below, activity feed on right" |
| Mood | Emotional tone | "Professional but approachable, energetic" |
| Constraints | What to avoid | "No purple, no glassmorphism, no rounded blob shapes" |

---

## Quality Tiers

### Tier 1: Bad (will produce generic output)

```
"Create a dashboard for a task management app"
```

Problems: No style direction, no color, no layout spec, no mood. Stitch will default to generic SaaS patterns.

### Tier 2: Acceptable (usable but not premium)

```
"Create a dashboard for a task management app with a dark theme, sidebar navigation,
stat cards at the top, and a task list below. Use blue and gray colors."
```

Problems: Blue+gray is generic. No geometry direction. No anti-cliche awareness. No mood.

### Tier 3: Good (premium, unique output)

```
"Dashboard for a project management SaaS targeting engineering teams. Sharp geometric
style with 0-2px border radius. Color palette: deep charcoal (#1a1a2e) background,
signal orange (#ff6b35) for primary actions and highlights, cool gray (#e2e8f0) for
secondary text. Layout: compact left sidebar (64px icons only) with main content split
into top metrics row (4 stat cards with micro-charts) and bottom area with kanban board.
Typography: mono-spaced headings (JetBrains Mono), sans-serif body (Inter). Mood:
technical precision, engineering-focused. No purple, no glassmorphism, no rounded blobs,
no gradient backgrounds."
```

Why it works: Specific colors, explicit geometry, layout detail, anti-cliche constraints, mood direction, typography guidance.

---

## Anti-Cliche Checklist

Before submitting any prompt, verify:

| Check | Pass | Fail |
|-------|------|------|
| No purple/violet/indigo as primary | Any non-purple primary | "Purple accent", "Indigo primary" |
| No glassmorphism as default | Solid backgrounds, raw borders | "Frosted glass effect", "Blur backdrop" |
| No standard hero split (50/50) | Asymmetric, stacked, overlapping | "Left text, right image" |
| Explicit color values or direction | "#ff6b35 orange" or "warm terracotta" | "Blue theme" or "modern colors" |
| Geometry is declared | "Sharp 0-2px radius" or "Soft 16-24px" | No mention of border-radius |
| No generic SaaS palette | Intentional, memorable palette | White + blue + gray |
| No "clean minimal modern" trio | Specific style name | "Clean, modern, minimal design" |

> These rules are derived from `@frontend-specialist` agent. When in doubt, reference the Purple Ban and Safe Harbor rules.

---

## Device-Specific Tips

### MOBILE Prompts

- **Thumb-zone awareness:** Place primary actions at bottom of screen
- **Bottom navigation:** Specify tab bar items explicitly
- **Single column:** Don't describe multi-column layouts for mobile
- **Touch targets:** Mention "large tap targets" or "44px minimum touch areas"
- **Card-based:** Mobile layouts work best with stacked cards
- **Status bar:** Mention "with status bar" if you want realistic phone frame

Example suffix:
```
"...Mobile layout with bottom tab navigation (Home, Tasks, Calendar, Profile),
single-column card stack, large touch targets, pull-to-refresh indicator at top."
```

### DESKTOP Prompts

- **Sidebar + content:** Most effective desktop pattern for apps
- **Multi-column:** Can use 2-3 column layouts
- **Hover states:** Mention hover indicators and tooltips
- **Dense information:** Desktop can show more data per screen
- **Keyboard shortcuts:** Can mention shortcut hints in UI

Example suffix:
```
"...Desktop layout with 240px collapsible sidebar, main content with 3-column grid,
top command bar with search and keyboard shortcut hints, hover-revealed action buttons
on list items."
```

---

## Templates by Screen Type

### 1. Dashboard

```
Dashboard for [PRODUCT] targeting [AUDIENCE]. [GEOMETRY] style with [RADIUS] border
radius. Color: [BG_COLOR] background, [PRIMARY] for CTAs and highlights, [SECONDARY]
for data/text. Layout: [SIDEBAR_SPEC], top row with [N] metric cards showing [METRICS],
main area with [CHART_TYPE] and [LIST/TABLE]. Typography: [HEADING_FONT] for headings,
[BODY_FONT] for data. Mood: [MOOD]. Constraints: [ANTI-CLICHES].
```

### 2. Login / Authentication

```
Login screen for [PRODUCT], [AUDIENCE] audience. [STYLE] aesthetic with [GEOMETRY].
Color: [BG] with [ACCENT] for the login button. Layout: [CENTERED/SPLIT/ASYMMETRIC]
with [BRANDING_ELEMENT], email and password fields, "Sign in" CTA, social login options
([PROVIDERS]), "Forgot password" and "Create account" links. [OPTIONAL: illustration or
brand graphic on [SIDE]]. Mood: [TRUST/WELCOMING/PROFESSIONAL]. No purple, no
glassmorphism cards.
```

### 3. Settings / Preferences

```
Settings screen for [PRODUCT]. [STYLE] with [GEOMETRY]. Color: [NEUTRAL_BG] with
[ACCENT] for active states and toggles. Layout: left settings categories list, right
content area with grouped form sections. Sections: [SECTION_LIST]. Each section has
clear labels, description text, and appropriate controls (toggles, dropdowns, inputs).
Mood: [ORGANIZED/CLEAN]. Constraints: [ANTI-CLICHES].
```

### 4. List / Detail (Master-Detail)

```
[ENTITY] list screen for [PRODUCT]. [STYLE] with [GEOMETRY]. Color: [PALETTE_SPEC].
Layout: [LIST_TYPE: table/cards/rows] with [COLUMNS_OR_FIELDS], filtering bar at top
with [FILTER_OPTIONS], sort controls, pagination. Each item shows [VISIBLE_FIELDS].
Selected item reveals detail panel on [RIGHT/BOTTOM/MODAL]. Mood: [MOOD].
Constraints: [ANTI-CLICHES].
```

### 5. Empty State

```
Empty state for [SCREEN_NAME] in [PRODUCT] when [CONDITION]. [STYLE] with [GEOMETRY].
Color: [PALETTE_SPEC] with [ILLUSTRATION_STYLE] illustration. Layout: centered content
with [ILLUSTRATION/ICON] above, headline explaining the state, supportive description,
and primary CTA "[ACTION_TEXT]". Mood: [ENCOURAGING/HELPFUL]. No sad/negative imagery.
Constraints: [ANTI-CLICHES].
```

### 6. Onboarding

```
Onboarding step [N] of [TOTAL] for [PRODUCT]. [STYLE] with [GEOMETRY]. Color:
[PALETTE_SPEC]. Layout: [FULL_SCREEN/CARD/SLIDESHOW] with progress indicator
([DOTS/BAR/STEPS]), [ILLUSTRATION/SCREENSHOT] showing [FEATURE], headline "[TITLE]",
body text explaining value, "[NEXT/SKIP]" buttons. Mood: [WELCOMING/EXCITING].
Constraints: [ANTI-CLICHES].
```

### 7. Checkout / Payment

```
Checkout screen for [PRODUCT]. [STYLE] with [GEOMETRY]. Color: [PALETTE_SPEC] with
[TRUST_COLOR] for security indicators. Layout: [SINGLE_PAGE/MULTI_STEP] with order
summary on [SIDE], payment form with card fields, billing address, [PAYMENT_METHODS]
icons, total amount prominent, "Pay [AMOUNT]" CTA. Trust signals: [SSL_BADGE/GUARANTEES].
Mood: [TRUSTWORTHY/SECURE]. Constraints: [ANTI-CLICHES].
```

### 8. Profile / Account

```
User profile screen for [PRODUCT]. [STYLE] with [GEOMETRY]. Color: [PALETTE_SPEC].
Layout: [HEADER_WITH_AVATAR] showing user name, role, and key stats, below: tabbed
sections for [TAB_LIST]. Active tab shows [CONTENT_DESCRIPTION]. Edit profile button
in header. Mood: [PERSONAL/PROFESSIONAL]. Constraints: [ANTI-CLICHES].
```

---

## Iteration Tips

After generating a screen, if the result needs refinement:

1. **Be specific about what to change:** "Make the sidebar narrower (48px), change CTA color to #e63946, add more whitespace between cards"
2. **Reference the original screen ID** when requesting changes
3. **Don't regenerate from scratch** unless the direction is fundamentally wrong
4. **Check `output_components`** for Stitch suggestions — they often provide useful iteration options
