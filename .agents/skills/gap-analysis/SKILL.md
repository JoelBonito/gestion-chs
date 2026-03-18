---
name: gap-analysis
description: Framework for GAP Analysis (AS-IS vs TO-BE) across product, technology, UX, design, and infrastructure dimensions. Provides structured templates for identifying and documenting gaps in each project dimension.
allowed-tools: Read, Glob, Grep
---

# GAP Analysis Framework

> "You can't close a gap you haven't measured."

## Purpose

Provide a structured methodology for identifying, documenting, and prioritizing gaps between the current state (AS-IS) and the desired state (TO-BE) across all project dimensions.

---

## Core Concept

```
AS-IS (Current State)
    │
    ├── What exists today?
    ├── What works well?
    └── What are the limitations?

    ▼ GAP = Distance between AS-IS and TO-BE

TO-BE (Desired State)
    │
    ├── What do we need?
    ├── What does the market expect?
    └── What are the requirements?

BRIDGE (Action Plan)
    │
    ├── What must we build/change?
    ├── What is the priority?
    └── What is the effort?
```

---

## GAP Dimensions

Each dimension has its own focus and appears in a specific document:

| Dimension | Document | Focus |
|-----------|----------|-------|
| **Product/Business** | PRD | Features, capabilities, market fit, metrics |
| **Experience** | UX Concept | Flows, friction, patterns, accessibility |
| **Infrastructure** | Architecture | Scalability, integrations, tech debt, patterns |
| **Technology** | Stack | Libraries, versions, deprecations, tooling |
| **Design** | Design System | Components, tokens, consistency, coverage |
| **Consolidated** | Backlog | All gaps prioritized into actionable tasks |

---

## GAP Analysis Template (Per Dimension)

### Standard GAP Table

```markdown
## GAP Analysis: [Dimension Name]

### Overview
- **Assessment Date:** {YYYY-MM-DD}
- **Assessed By:** {Agent Name}
- **Overall GAP Severity:** Critical / High / Medium / Low

### GAP Inventory

| ID | Area | AS-IS (Current) | TO-BE (Required) | GAP Description | Severity | Effort | Priority |
|----|------|-----------------|------------------|-----------------|----------|--------|----------|
| G-{DIM}-01 | [Area] | [Current state] | [Desired state] | [What's missing] | Critical/High/Medium/Low | S/M/L/XL | P0/P1/P2 |
| G-{DIM}-02 | [Area] | [Current state] | [Desired state] | [What's missing] | Critical/High/Medium/Low | S/M/L/XL | P0/P1/P2 |

### Risk Assessment
| GAP ID | Risk if Not Addressed | Impact | Mitigation |
|--------|----------------------|--------|------------|
| G-{DIM}-01 | [Consequence] | [Business impact] | [What to do] |
```

---

## Dimension-Specific Templates

### 1. Product/Business GAP (PRD)

```markdown
## GAP Analysis: Product & Business

### Feature Coverage
| Feature | Market Expectation | Current State | GAP | Priority |
|---------|-------------------|---------------|-----|----------|
| [Feature A] | [What competitors offer] | [What we have/don't have] | [Delta] | P0/P1/P2 |

### Capability Assessment
| Capability | Required Level | Current Level | GAP | Effort to Close |
|------------|---------------|---------------|-----|-----------------|
| [Capability] | [Target] | [Current] | [Delta] | S/M/L/XL |

### Metrics GAP
| Metric | Current Value | Target Value | GAP | Strategy to Close |
|--------|--------------|--------------|-----|-------------------|
| [Metric] | [Current or N/A] | [Target] | [Delta] | [How] |

### Competitive GAP
| Competitor | Their Strength | Our Position | GAP | Differentiator Strategy |
|------------|---------------|--------------|-----|------------------------|
| [Competitor] | [What they do well] | [Where we stand] | [Delta] | [How we differentiate] |
```

### 2. Experience GAP (UX Concept)

```markdown
## GAP Analysis: User Experience

### Flow Assessment
| User Flow | Current State | Ideal State | Friction Points | GAP Severity |
|-----------|--------------|-------------|-----------------|--------------|
| [Flow name] | [How it works now] | [How it should work] | [Pain points] | Critical/High/Medium/Low |

### UX Pattern Coverage
| Pattern | Industry Standard | Current Implementation | GAP | Impact on UX |
|---------|-------------------|----------------------|-----|--------------|
| [Pattern] | [Best practice] | [What exists] | [What's missing] | High/Medium/Low |

### Accessibility GAP
| WCAG Criterion | Required Level | Current Level | GAP | Remediation |
|----------------|---------------|---------------|-----|-------------|
| [Criterion] | AA/AAA | [Current] | [Delta] | [Fix] |

### Friction Mapping
| Touchpoint | Expected Experience | Actual Experience | Friction Score (1-5) | Fix Priority |
|------------|--------------------|--------------------|---------------------|-------------|
| [Touchpoint] | [What user expects] | [What happens] | [1-5] | P0/P1/P2 |
```

### 3. Infrastructure GAP (Architecture)

```markdown
## GAP Analysis: Architecture & Infrastructure

### Architecture Assessment
| Component | Current Architecture | Required Architecture | GAP | Migration Effort |
|-----------|---------------------|----------------------|-----|-----------------|
| [Component] | [What exists] | [What's needed] | [Delta] | S/M/L/XL |

### Scalability Assessment
| Dimension | Current Capacity | Projected Need (6mo) | Projected Need (12mo) | GAP |
|-----------|-----------------|---------------------|----------------------|-----|
| Users | [Current] | [6mo target] | [12mo target] | [Delta] |
| Data | [Current] | [6mo target] | [12mo target] | [Delta] |
| Requests/sec | [Current] | [6mo target] | [12mo target] | [Delta] |

### Integration Assessment
| Integration | Required | Exists | Status | GAP | Effort |
|-------------|----------|--------|--------|-----|--------|
| [System/API] | Yes/No | Yes/No | Active/Planned/Missing | [Delta] | S/M/L/XL |

### Technical Debt Inventory
| Debt Item | Current Impact | Future Risk | Effort to Resolve | Priority |
|-----------|---------------|-------------|-------------------|----------|
| [Debt] | [Impact now] | [Risk if ignored] | S/M/L/XL | P0/P1/P2 |
```

### 4. Technology GAP (Stack)

```markdown
## GAP Analysis: Technology Stack

### Current vs Required Stack
| Layer | Current Technology | Required Technology | Reason for Change | Migration Effort |
|-------|-------------------|--------------------|--------------------|-----------------|
| [Layer] | [Current] | [Required] | [Why change] | S/M/L/XL |

### Version & Deprecation
| Technology | Current Version | Latest Stable | EOL Date | Action Required |
|------------|----------------|---------------|----------|-----------------|
| [Tech] | [Current] | [Latest] | [Date] | Update/Migrate/Monitor |

### Missing Libraries/Tools
| Need | Category | Recommended Solution | Alternatives | Priority |
|------|----------|---------------------|--------------|----------|
| [Need] | [Category] | [Library] | [Alt 1, Alt 2] | P0/P1/P2 |

### Tooling GAP
| Tool Category | Current | Recommended | GAP | Impact |
|---------------|---------|-------------|-----|--------|
| CI/CD | [Current] | [Ideal] | [Delta] | High/Medium/Low |
| Monitoring | [Current] | [Ideal] | [Delta] | High/Medium/Low |
| Testing | [Current] | [Ideal] | [Delta] | High/Medium/Low |
```

### 5. Design GAP (Design System)

```markdown
## GAP Analysis: Design System

### Component Coverage
| Component | Required (from PRD) | Exists | Status | GAP | Priority |
|-----------|--------------------|--------|--------|-----|----------|
| [Component] | Yes | Yes/No | Complete/Partial/Missing | [Delta] | P0/P1/P2 |

### Visual Consistency
| Area | Current State | Target State | Inconsistencies | Fix Priority |
|------|--------------|--------------|-----------------|-------------|
| Colors | [State] | [Target] | [Issues] | P0/P1/P2 |
| Typography | [State] | [Target] | [Issues] | P0/P1/P2 |
| Spacing | [State] | [Target] | [Issues] | P0/P1/P2 |
| Icons | [State] | [Target] | [Issues] | P0/P1/P2 |

### Token Coverage
| Token Category | Defined | Missing | Coverage % |
|---------------|---------|---------|------------|
| Colors | [N] | [N] | [%] |
| Typography | [N] | [N] | [%] |
| Spacing | [N] | [N] | [%] |
| Shadows | [N] | [N] | [%] |
| Breakpoints | [N] | [N] | [%] |

### Responsive Coverage
| Breakpoint | Components Tested | Components Untested | Coverage % |
|------------|-------------------|--------------------|-----------|
| Mobile | [N] | [N] | [%] |
| Tablet | [N] | [N] | [%] |
| Desktop | [N] | [N] | [%] |
```

---

## GAP Consolidation (Backlog)

The Backlog document consolidates ALL gaps from ALL dimensions:

```markdown
## Consolidated GAP Summary

### By Severity
| Severity | Product | UX | Architecture | Stack | Design | Total |
|----------|---------|-----|-------------|-------|--------|-------|
| Critical | [N] | [N] | [N] | [N] | [N] | [N] |
| High | [N] | [N] | [N] | [N] | [N] | [N] |
| Medium | [N] | [N] | [N] | [N] | [N] | [N] |
| Low | [N] | [N] | [N] | [N] | [N] | [N] |

### GAP-to-Task Mapping
| GAP ID | Source Document | Epic | Story | Priority | Status |
|--------|----------------|------|-------|----------|--------|
| G-PRD-01 | PRD | Epic 1 | Story 1.1 | P0 | TODO |
| G-UX-03 | UX Concept | Epic 2 | Story 2.2 | P1 | TODO |
| G-ARCH-01 | Architecture | Epic 1 | Story 1.3 | P0 | TODO |

### Roadmap to Close Gaps
| Phase | Gaps Addressed | Milestone | Dependencies |
|-------|---------------|-----------|-------------|
| Phase 1 | G-PRD-01, G-ARCH-01 | Foundation ready | None |
| Phase 2 | G-UX-01, G-UX-03 | Core flows complete | Phase 1 |
| Phase 3 | G-DS-01, G-STACK-02 | Polish & consistency | Phase 2 |
```

---

## Severity Classification

| Severity | Definition | Action |
|----------|-----------|--------|
| **Critical** | Blocks launch or causes data loss/security issue | Must fix before MVP |
| **High** | Significantly degrades value proposition | Fix in MVP if possible |
| **Medium** | Noticeable quality reduction | Plan for v1.1 |
| **Low** | Minor improvement opportunity | Backlog for future |

---

## Effort Classification

| Size | Definition | Typical Scope |
|------|-----------|---------------|
| **S** | Small | Single file change, config update |
| **M** | Medium | Feature addition, component creation |
| **L** | Large | System-level change, migration |
| **XL** | Extra Large | Architecture redesign, platform change |

---

## Rules

1. **Every GAP must have an ID** — Format: `G-{DIM}-{NN}` (e.g., G-PRD-01, G-UX-03)
2. **Every GAP must map to a task** — No orphan gaps in the Backlog
3. **Severity must be justified** — Don't inflate or deflate
4. **AS-IS must be honest** — Document what actually exists, not what was planned
5. **TO-BE must be realistic** — Aligned with Brief vision and PRD requirements
6. **Greenfield projects still have gaps** — The gap is "nothing exists → everything needed"
7. **GAPs are not failures** — They are planning instruments for informed decisions
