# Wireframe-to-Prompt Conversion

> Systematic method for converting textual wireframes from the UX Concept document into high-quality Stitch prompts.

---

## Input Format Recognition

The UX Concept (Section 4) follows this structure for each screen:

```markdown
### 4.X Screen: [Name]
**Purpose:** [Why this screen exists]
**Entry:** [How user arrives]
**Exit:** [Where user goes next]

**Layout:**
[ASCII art or textual description of spatial arrangement]

**Elements:**
| Element | Type | Behavior | Priority |
|---------|------|----------|----------|
| [Element] | [Type] | [Interaction] | Primary/Secondary |

**States:**
| State | Trigger | Display |
|-------|---------|---------|
| Empty | [Condition] | [What shows] |
| Loading | [Condition] | [What shows] |
| Error | [Condition] | [What shows] |
| Success | [Condition] | [What shows] |
```

---

## 7-Step Conversion Algorithm

### Step 1: Extract Screen Identity

From the wireframe, extract:
- **Screen name** (from heading)
- **Screen purpose** (from Purpose field)
- **Screen type** (Dashboard, List, Detail, Form, etc.)

Map to prompt: `[SCREEN TYPE] for [PRODUCT]`

### Step 2: Parse Layout Structure

Read the Layout field (ASCII art or description). Convert spatial relationships to prompt language:

| Wireframe Pattern | Prompt Translation |
|-------------------|--------------------|
| `[Sidebar] \| [Content]` | "Left sidebar with main content area" |
| `[Header] / [Content] / [Footer]` | "Full-width header, scrollable content area, fixed bottom bar" |
| `[Tabs] / [Tab Content]` | "Top tab navigation with swappable content panels below" |
| `[Card] [Card] [Card]` (horizontal) | "Horizontal card row" or "3-column card grid" |
| `[Card] / [Card] / [Card]` (vertical) | "Vertically stacked cards" |

### Step 3: Read Elements Table

For each element in the Elements table:
1. Note the element name and type
2. Check if Priority is Primary — these MUST appear in the prompt
3. Note behaviors that affect visual design (e.g., "expandable", "draggable")

Map to prompt: `[KEY ELEMENTS]` segment listing Primary elements explicitly.

### Step 4: Check States

Review the States table. Determine which state to generate:

| Priority | State | When to Generate |
|----------|-------|-----------------|
| 1 (always) | Success | Default state with real-looking data |
| 2 (if applicable) | Empty | For screens with user-generated content |
| 3 (if relevant) | Error | Only if error state is highlighted in the Friction Map |
| 4 (rarely) | Loading | Usually not worth a Stitch generation |

### Step 5: Cross-reference with Brief

Read the Product Brief to extract:
- **Brand tone:** Professional? Playful? Luxury?
- **Target audience:** Age, tech-savviness, expectations
- **Product category:** SaaS, marketplace, social, etc.

Map to prompt: `[MOOD]` and `[VISUAL STYLE]` segments.

### Step 6: Apply Anti-Cliche Rules

Reference `prompt-engineering.md` anti-cliche checklist:
- Choose an explicit color direction (NOT blue + white)
- Declare geometry (sharp vs rounded, with specific radius)
- Avoid standard hero split
- No purple as primary
- No glassmorphism as default

Map to prompt: `[COLOR DIRECTION]` and `[CONSTRAINTS]` segments.

### Step 7: Compose Final Prompt

Assemble all segments following the anatomy from `prompt-engineering.md`:

```
[SCREEN TYPE] + [VISUAL STYLE] + [COLOR DIRECTION] + [LAYOUT STRUCTURE] + [KEY ELEMENTS] + [MOOD] + [CONSTRAINTS]
```

---

## Example 1: Task Dashboard

### Input (from UX Concept):

```markdown
### 4.1 Screen: Dashboard
**Purpose:** Central hub showing task overview and quick actions
**Entry:** After login or from bottom navigation
**Exit:** To task detail, create task, or settings

**Layout:**
+--------------------------------------------------+
| [Header: Logo | Search | Notifications | Avatar]  |
+--------------------------------------------------+
| [Quick Stats Row: 4 metric cards]                  |
| [Active Tasks Section: card list with status]      |
| [Recent Activity: timeline feed]                   |
+--------------------------------------------------+
| [Bottom Nav: Home | Tasks | Calendar | Profile]    |
+--------------------------------------------------+

**Elements:**
| Element | Type | Behavior | Priority |
|---------|------|----------|----------|
| Quick Stats | Metrics | Tap to filter | Primary |
| Active Tasks | Card List | Swipe to complete | Primary |
| Recent Activity | Feed | Scroll, tap to detail | Secondary |
| FAB Create | Button | Opens create flow | Primary |
| Search | Input | Expands on tap | Secondary |

**States:**
| State | Trigger | Display |
|-------|---------|---------|
| Empty | No tasks | Illustration + "Create your first task" |
| Success | Has tasks | Full dashboard with data |
```

### Output (Stitch Prompt):

**MOBILE (Success state):**
```
Task management dashboard for a productivity app targeting young professionals (25-35).
Clean geometric style with sharp 2px border radius. Color: off-white (#fafafa) background,
signal orange (#e8590c) for primary actions and FAB button, charcoal (#2d3436) for headings,
warm gray (#636e72) for secondary text. Layout: top header with logo, search icon, notification
bell, and user avatar. Below: horizontal scrollable row of 4 stat cards (Total Tasks, In Progress,
Completed Today, Overdue) with micro icons. Main area: vertical stack of task cards showing task
name, due date, priority tag, and assignee avatar. Each card has a subtle left border color-coded
by priority. Bottom: floating action button (orange circle with plus icon) above a 4-tab bottom
navigation bar (Home active, Tasks, Calendar, Profile). Typography: DM Sans for headings, Inter
for body text. Mood: productive, organized, energetic. Mobile layout with 44px touch targets.
No purple, no glassmorphism, no gradient backgrounds, no rounded blob shapes.
```

**MOBILE (Empty state):**
```
Empty state for task management dashboard targeting young professionals. Clean geometric style
with sharp 2px border radius. Color: off-white (#fafafa) background, signal orange (#e8590c)
for the CTA button. Layout: same header and bottom navigation as the full dashboard, but the
main content area shows a centered illustration of an empty clipboard with a subtle checkmark,
headline "No tasks yet", supportive text "Create your first task to get started", and an orange
CTA button "Create Task". The stat cards row shows all zeros. Mood: encouraging, inviting.
No sad or negative imagery. No purple, no glassmorphism.
```

---

## Example 2: User Settings

### Input (from UX Concept):

```markdown
### 4.5 Screen: Settings
**Purpose:** Manage account, preferences, and app configuration
**Entry:** From profile or sidebar menu
**Exit:** Back to previous screen

**Layout:**
+--------------------------------------------------+
| [Header: Back Arrow | "Settings" | Save]           |
+--------------------------------------------------+
| [Section: Account]                                 |
|   - Profile photo, Name, Email                     |
| [Section: Preferences]                             |
|   - Notifications toggle                           |
|   - Theme selector                                 |
|   - Language dropdown                              |
| [Section: Security]                                |
|   - Change password                                |
|   - Two-factor auth toggle                         |
| [Danger Zone]                                      |
|   - Delete account                                 |
+--------------------------------------------------+

**Elements:**
| Element | Type | Behavior | Priority |
|---------|------|----------|----------|
| Profile section | Form group | Editable fields | Primary |
| Notification toggle | Toggle | On/off | Primary |
| Theme selector | Segmented | Light/Dark/System | Secondary |
| Delete account | Button | Confirmation dialog | Secondary |
```

### Output (Stitch Prompt):

**MOBILE:**
```
Settings screen for a productivity app. Clean organized style with sharp 2px border radius.
Color: white (#ffffff) background, charcoal (#2d3436) for section headers, warm gray (#636e72)
for labels, signal orange (#e8590c) for active toggles and save button, pale red (#ffe0e0) background
for danger zone section. Layout: top header with back arrow, "Settings" title centered, and Save
button. Main content: vertically scrolling grouped sections separated by 24px spacing. Account
section with circular profile photo placeholder, name field, email field. Preferences section with
notification toggle, theme segmented control (Light/Dark/System), language dropdown. Security section
with "Change password" row with chevron, two-factor toggle. Danger zone section with distinct pale
red background containing "Delete account" text button in red. Each section has a bold section
header. Typography: DM Sans for section headers, Inter for body. Mood: organized, trustworthy.
No purple, no glassmorphism, no decorative elements.
```

---

## State Generation Priority

| Screen Has User Content? | Generate These States |
|--------------------------|----------------------|
| Yes (tasks, posts, data) | Success first, then Empty |
| No (settings, profile) | Success only |
| Critical error flows | Success, then Error (from Friction Map) |
| Onboarding/welcome | Each step as separate screen |

> **Rule:** Always generate Success state first. It establishes the visual identity. Empty and Error states derive from it.
