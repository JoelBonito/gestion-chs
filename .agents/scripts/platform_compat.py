#!/usr/bin/env python3
"""
Inove AI Framework - Platform Compatibility Helper
Provides utilities for multi-platform support (Claude Code + Codex CLI + Antigravity/Gemini)

Usage:
    from platform_compat import get_agent_root, get_agent_source, resolve_doc_path, resolve_doc_file

    root = get_agent_root()  # Returns Path to .agents/
    source = get_agent_source()  # Returns 'claude_code', 'codex', 'antigravity', or 'unknown'
    plan_dir = resolve_doc_path("planejamento")  # docs/01-Planejamento OR docs/planning
    arch_file = resolve_doc_file("planejamento", "04-architecture.md")  # first match

Supported Platforms:
    - Claude Code: CLAUDE.md → .agents/
    - Codex CLI: AGENTS.md → .codex/ (symlinks to .agents/)
    - Antigravity/Gemini: GEMINI.md → .agents/
"""

import os
from pathlib import Path
from typing import Optional


def get_agent_root() -> Path:
    """
    Returns the path to the agents directory.
    Compatible with both Claude Code (.agents/) and legacy (.agent/).

    Returns:
        Path: Path to the agents root directory
    """
    # Check possible locations in order of preference
    candidates = [".agents", ".agent", ".codex"]

    for candidate in candidates:
        path = Path(candidate)
        if path.exists() and path.is_dir():
            # For .codex, resolve symlinks to get actual path
            if candidate == ".codex":
                skills_path = path / "skills"
                if skills_path.is_symlink():
                    resolved = skills_path.resolve().parent
                    if resolved.exists():
                        return resolved
            return path

    # Default to .agents even if it doesn't exist
    return Path(".agents")


def get_agent_source() -> str:
    """
    Detects which AI tool is currently executing.

    Returns:
        str: 'codex', 'claude_code', 'antigravity', or 'unknown'
    """
    # Check environment variables set by tools
    if os.environ.get("CODEX_SESSION"):
        return "codex"

    if os.environ.get("CLAUDE_CODE_SESSION"):
        return "claude_code"

    # Check for Antigravity/Gemini
    if os.environ.get("ANTIGRAVITY_SESSION") or os.environ.get("GEMINI_SESSION"):
        return "antigravity"

    # Fallback to explicit environment variable
    return os.environ.get("AGENT_SOURCE", "unknown")


# ---------------------------------------------------------------------------
# Doc Path Resolution — maps logical names to official + fallback paths
# ---------------------------------------------------------------------------

# Official (created by /define) → Legacy/alternative aliases
DOC_PATHS = {
    "planejamento":  ["docs/01-Planejamento",  "docs/planning"],
    "contexto":      ["docs/00-Contexto",      "docs/context"],
    "requisitos":    ["docs/02-Requisitos",     "docs/requirements"],
    "arquitetura":   ["docs/03-Arquitetura",    "docs/architecture"],
    "api":           ["docs/04-API",            "docs/api"],
    "logs":          ["docs/08-Logs-Sessoes",   "docs/logs"],
}


def resolve_doc_path(
    logical_name: str,
    root_path: Optional[Path] = None,
    create: bool = False,
) -> Optional[Path]:
    """
    Resolves a logical doc folder name to the first existing path on disk.

    Tries the official path first, then falls back to known aliases.
    If *create* is True and no path exists, creates the official (first) path.

    Args:
        logical_name: Key in DOC_PATHS (e.g. "planejamento", "arquitetura").
        root_path: Project root. Defaults to current directory.
        create: Create the official path when nothing exists.

    Returns:
        Path to the resolved directory, or None if not found and create=False.
    """
    base = root_path or Path(".")
    candidates = DOC_PATHS.get(logical_name)
    if not candidates:
        return None

    for rel in candidates:
        full = base / rel
        if full.exists() and full.is_dir():
            return full

    if create:
        official = base / candidates[0]
        official.mkdir(parents=True, exist_ok=True)
        return official

    return None


def resolve_doc_file(
    logical_name: str,
    filename: str,
    root_path: Optional[Path] = None,
) -> Optional[Path]:
    """
    Resolves a specific file inside a logical doc folder.

    Example:
        resolve_doc_file("planejamento", "04-architecture.md")
        # returns docs/01-Planejamento/04-architecture.md  OR
        #         docs/planning/04-architecture.md

    Args:
        logical_name: Key in DOC_PATHS.
        filename: File name inside the folder.
        root_path: Project root.

    Returns:
        Path to the file if found, else None.
    """
    base = root_path or Path(".")
    candidates = DOC_PATHS.get(logical_name, [])

    for rel in candidates:
        full = base / rel / filename
        if full.exists():
            return full

    return None


def find_backlog(root_path: Optional[Path] = None) -> Optional[Path]:
    """
    Finds the backlog file in known locations.

    Args:
        root_path: Optional root path to search from. Defaults to current directory.

    Returns:
        Path to backlog file or None if not found.
    """
    base = root_path or Path(".")
    candidates = [
        base / "docs" / "BACKLOG.md",
        base / "BACKLOG.md",
    ]

    # Add all DOC_PATHS folders as potential backlog locations
    for paths in DOC_PATHS.values():
        for rel in paths:
            candidates.append(base / rel / "BACKLOG.md")

    # Also search for alternative names
    docs_path = base / "docs"
    if docs_path.exists():
        candidates.extend(docs_path.rglob("global-task-list.md"))
        candidates.extend(docs_path.rglob("task-list.md"))

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def find_logs_dir(auto_create: bool = False) -> Optional[Path]:
    """
    Finds the session logs directory.

    Args:
        auto_create: If True, creates the default directory when not found.

    Returns:
        Path to logs directory, or None if not found and auto_create is False.
    """
    candidates = [
        Path("docs/08-Logs-Sessoes"),
        Path("Docs/08-Logs-Sessoes"),
        Path("logs"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    if auto_create:
        default_dir = Path("docs/08-Logs-Sessoes")
        default_dir.mkdir(parents=True, exist_ok=True)
        return default_dir

    return None


def get_config_path(platform: str = None) -> Path:
    """
    Returns the path to the configuration file for the specified platform.

    Args:
        platform: 'codex', 'claude', or None (auto-detect)

    Returns:
        Path: Path to the configuration file
    """
    root = get_agent_root()

    if platform is None:
        platform = get_agent_source()

    config_map = {
        "codex": root / "config" / "codex.toml",
        "claude_code": root / "config" / "claude.json",
        "antigravity": root / "rules" / "GEMINI.md",
    }

    return config_map.get(platform, root / "config" / "codex.toml")


def get_skills_path() -> Path:
    """Returns the path to the skills directory."""
    return get_agent_root() / "skills"


def get_agents_path() -> Path:
    """Returns the path to the agents directory."""
    return get_agent_root() / "agents"


def get_workflows_path() -> Path:
    """Returns the path to the workflows directory."""
    return get_agent_root() / "workflows"


def get_scripts_path() -> Path:
    """Returns the path to the scripts directory."""
    return get_agent_root() / "scripts"


# ---------------------------------------------------------------------------
# Log Parsing Utilities (used by dashboard.py, sync_tracker.py)
# ---------------------------------------------------------------------------

import re
from datetime import datetime, timedelta
from typing import List, Dict, NamedTuple


class Session(NamedTuple):
    """Represents a work session parsed from daily log files."""
    date: str
    project: str
    start: str
    end: str
    duration_minutes: int
    activities: List[str]
    agent_source: str = "unknown"


def _parse_duration(duration_str: str) -> int:
    """Converts 'HH:MM' to minutes."""
    match = re.match(r"(\d{1,2}):(\d{2})", duration_str)
    if match:
        return int(match.group(1)) * 60 + int(match.group(2))
    return 0


def parse_log_file(filepath: Path) -> List[Session]:
    """Extracts sessions from a daily log markdown file."""
    content = filepath.read_text(encoding="utf-8")

    date_match = re.search(r"LOG DI[AÁ]RIO\s*[—–-]\s*(\d{4}-\d{2}-\d{2})", content)
    project_match = re.search(r"- Projeto:\s*(.+)", content)

    if not date_match:
        return []

    date = date_match.group(1)
    project = project_match.group(1).strip() if project_match else "Unknown"

    sessions: List[Session] = []
    session_pattern = re.compile(
        r"^\d+\.\s+(\d{1,2}:\d{2})\s*[—–-]\s*(\d{1,2}:\d{2})\s*\((\d{1,2}:\d{2})\)\s*(?:\[.*?([a-z_]+)\])?",
        re.MULTILINE | re.IGNORECASE,
    )

    for match in session_pattern.finditer(content):
        start_pos = match.end()
        next_match = session_pattern.search(content, start_pos)
        end_pos = next_match.start() if next_match else len(content)
        section = content[start_pos:end_pos]
        activities = re.findall(r"^\s+-\s+(.+)$", section, re.MULTILINE)

        sessions.append(Session(
            date=date,
            project=project,
            start=match.group(1),
            end=match.group(2),
            duration_minutes=_parse_duration(match.group(3)),
            activities=activities,
            agent_source=match.group(4) or "unknown",
        ))

    return sessions


def get_logs_in_range(logs_dir: Path, start_date: datetime, end_date: datetime) -> List[Session]:
    """Returns all sessions in a date range."""
    all_sessions: List[Session] = []
    for year_dir in logs_dir.iterdir():
        if not year_dir.is_dir():
            continue
        for log_file in year_dir.glob("*.md"):
            try:
                file_date = datetime.strptime(log_file.stem, "%Y-%m-%d")
            except ValueError:
                continue
            if start_date.date() <= file_date.date() <= end_date.date():
                all_sessions.extend(parse_log_file(log_file))
    return sorted(all_sessions, key=lambda s: (s.date, s.start))


def get_last_activity_by_agent(logs_dir: Path, days_back: int = 7) -> Dict[str, dict]:
    """Returns last activity per agent over the last N days."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    sessions = get_logs_in_range(logs_dir, start_date, end_date)

    agent_stats: Dict[str, dict] = {}
    for session in sessions:
        agent = session.agent_source
        if agent not in agent_stats:
            agent_stats[agent] = {
                "last_session": session,
                "last_activity": session.activities[-1] if session.activities else "No activity",
                "total_time_week": 0,
                "sessions_count": 0,
            }
        current = agent_stats[agent]
        if session.date > current["last_session"].date or (
            session.date == current["last_session"].date
            and session.start > current["last_session"].start
        ):
            current["last_session"] = session
            current["last_activity"] = session.activities[-1] if session.activities else "No activity"
        current["total_time_week"] += session.duration_minutes
        current["sessions_count"] += 1

    return agent_stats


# ---------------------------------------------------------------------------
# Bootstrap: ensure docs structure exists (idempotent)
# ---------------------------------------------------------------------------

import subprocess as _subprocess


def _get_git_branch() -> str:
    """Returns current git branch or 'unknown' if git is unavailable."""
    try:
        return _subprocess.check_output(
            ["git", "branch", "--show-current"],
            text=True, stderr=_subprocess.DEVNULL,
        ).strip() or "unknown"
    except (FileNotFoundError, _subprocess.CalledProcessError):
        return "unknown"


def _get_git_available() -> bool:
    """Returns True if we are inside a git repository."""
    try:
        _subprocess.run(
            ["git", "rev-parse", "--git-dir"],
            capture_output=True, check=True,
        )
        return True
    except (FileNotFoundError, _subprocess.CalledProcessError):
        return False


_BACKLOG_TEMPLATE = """\
# Backlog

## Epic 1: Placeholder [P0]
- [ ] Story 1.1: Definir primeira tarefa real do projeto
"""

_PROJECT_STATUS_TEMPLATE = """\
# Project Status

**Atualizado:** {timestamp}
**Branch:** `{branch}`
**Progresso:** {progress_bar} {percent}% ({done}/{total})

## Proxima Story
{next_story_block}

{routing_alert}

## Progresso por Epic
| Epic | Status | Progresso |
|------|--------|-----------|
{epic_table}

## Ultimos Commits
```
{commits}
```
"""

_PROJECT_STATUS_INITIAL = """\
# Project Status

**Atualizado:** {timestamp}
**Branch:** `{branch}`
**Progresso:** ░░░░░░░░░░ 0% (0/0)

## Proxima Story
Nenhuma story pendente. Execute /define para criar o backlog.

## Progresso por Epic
| Epic | Status | Progresso |
|------|--------|-----------|
| (nenhum epic) | - | - |

## Ultimos Commits
```
(nenhum commit registrado)
```
"""

STORY_TEMPLATE = """\
---
story: "{story_id}"
epic: "Epic {epic_num}: {epic_name}"
status: {status}
agent: {agent}
tool: {tool}
depends_on: {depends_on}
unlocks: {unlocks}
priority: {priority}
spec_hash: "{spec_hash}"
---

# Story {story_id}: {title}

## Contexto do Epic
{epic_context}

## Requisito
{requirement}

## Criterios de Aceite
{acceptance_criteria}

## Contexto de Dependencias
{dependency_context}

## Agent Workspace
{workspace}
"""

# Tool mapping: which tool runs each agent type
TOOL_MAPPING = {
    # Design/Planning → antigravity (Gemini)
    "ux-researcher": "antigravity",
    # Implementation → codex
    "frontend-specialist": "codex",
    "backend-specialist": "codex",
    "database-architect": "codex",
    "security-auditor": "codex",
    "devops-engineer": "codex",
    "test-engineer": "codex",
    "qa-automation-engineer": "codex",
    "debugger": "codex",
    "mobile-developer": "codex",
    "game-developer": "codex",
    "performance-optimizer": "codex",
    "seo-specialist": "codex",
    "penetration-tester": "codex",
    # Planning/Strategy → claude_code por padrão
    "orchestrator": "claude_code",
    "project-planner": "claude_code",
    "product-manager": "claude_code",
    "product-owner": "claude_code",
    "code-archaeologist": "claude_code",
    "documentation-writer": "claude_code",
    "explorer-agent": "claude_code",
}


def get_tool_for_agent(agent: str, source: Optional[str] = None) -> str:
    """
    Returns the recommended tool for a given agent name.

    Standalone mode: when a single tool runs without others, all agents
    are normalized to the current tool (everything executes locally).
    """
    tool = TOOL_MAPPING.get(agent, "codex")
    agent_source = source or get_agent_source()

    # Standalone: normalize to the running tool
    if agent_source in ("codex", "claude_code", "antigravity") and tool != agent_source:
        return agent_source

    return tool


def find_stories_dir(root_path: Optional[Path] = None) -> Path:
    """
    Returns the path to docs/stories/ directory.

    Args:
        root_path: Project root. Defaults to current directory.

    Returns:
        Path to stories directory (may not exist yet).
    """
    base = root_path or Path(".")
    return base / "docs" / "stories"


def find_story_file(story_id: str, root_path: Optional[Path] = None) -> Optional[Path]:
    """
    Locates a story file by its ID (e.g., '1.1', '0.3').

    Searches docs/stories/ for STORY-{N-N}_*.md pattern.

    Args:
        story_id: Story ID like '1.1' or '0.3'.
        root_path: Project root. Defaults to current directory.

    Returns:
        Path to the story file, or None if not found.
    """
    stories_dir = find_stories_dir(root_path)
    if not stories_dir.exists():
        return None

    safe_id = story_id.replace(".", "-")
    prefix = f"STORY-{safe_id}_"
    for f in stories_dir.glob(f"{prefix}*.md"):
        return f
    return None


def parse_story_frontmatter(story_path: Path) -> dict:
    """
    Reads YAML-like frontmatter from a story file.

    Args:
        story_path: Path to the story .md file.

    Returns:
        Dict with keys: story, epic, status, agent, tool, depends_on, unlocks, priority.
        Returns empty dict if file not found or no frontmatter.
    """
    if not story_path.exists():
        return {}

    content = story_path.read_text(encoding="utf-8")

    # Check for frontmatter delimiters
    if not content.startswith("---"):
        return {}

    end_idx = content.find("---", 3)
    if end_idx == -1:
        return {}

    frontmatter = content[3:end_idx].strip()
    result = {}

    for line in frontmatter.split("\n"):
        line = line.strip()
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        # Parse list values like ["0.1", "0.2"]
        if value.startswith("[") and value.endswith("]"):
            inner = value[1:-1].strip()
            if inner:
                result[key] = [v.strip().strip('"').strip("'") for v in inner.split(",")]
            else:
                result[key] = []
        else:
            result[key] = value

    return result


def ensure_backlog(create_if_missing: bool = True) -> dict:
    """
    Finds or creates docs/BACKLOG.md.

    Args:
        create_if_missing: If True, creates a minimal backlog when absent.

    Returns:
        dict with keys: path (str|None), created (bool), existed (bool)
    """
    existing = find_backlog()
    if existing:
        return {"path": str(existing), "created": False, "existed": True}

    if not create_if_missing:
        return {"path": None, "created": False, "existed": False}

    target = Path("docs/BACKLOG.md")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(_BACKLOG_TEMPLATE, encoding="utf-8")
    return {"path": str(target), "created": True, "existed": False}


def ensure_project_status(create_if_missing: bool = True) -> dict:
    """
    Finds or creates docs/PROJECT_STATUS.md.

    Args:
        create_if_missing: If True, creates a minimal status file when absent.

    Returns:
        dict with keys: path (str|None), created (bool), existed (bool)
    """
    target = Path("docs/PROJECT_STATUS.md")
    if target.exists():
        return {"path": str(target), "created": False, "existed": True}

    if not create_if_missing:
        return {"path": None, "created": False, "existed": False}

    branch = _get_git_branch()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        _PROJECT_STATUS_INITIAL.format(timestamp=timestamp, branch=branch),
        encoding="utf-8",
    )
    return {"path": str(target), "created": True, "existed": False}


def ensure_docs_structure(create_if_missing: bool = True) -> dict:
    """
    Ensures docs/ baseline exists (BACKLOG.md + PROJECT_STATUS.md).

    Idempotent: never overwrites existing files.

    Args:
        create_if_missing: If True (default), creates missing files.
                           If False, only detects and reports.

    Returns:
        dict with keys: created (list[str]), existing (list[str]),
                        missing (list[str]), warnings (list[str]),
                        git (dict with available, branch)
    """
    result = {
        "created": [],
        "existing": [],
        "missing": [],
        "warnings": [],
        "git": {
            "available": _get_git_available(),
            "branch": _get_git_branch(),
        },
    }

    for label, fn in [("BACKLOG", ensure_backlog), ("PROJECT_STATUS", ensure_project_status)]:
        info = fn(create_if_missing=create_if_missing)
        if info["existed"]:
            result["existing"].append(info["path"])
        elif info["created"]:
            result["created"].append(info["path"])
        else:
            result["missing"].append(f"docs/{label}.md")

    if not result["git"]["available"]:
        result["warnings"].append("Git not available — branch set to 'unknown'")

    return result


# For backwards compatibility
AGENT_ROOT = get_agent_root()
AGENT_SOURCE = get_agent_source()


if __name__ == "__main__":
    # Self-test when run directly
    print("Inove AI Framework - Platform Compatibility Helper")
    print("=" * 50)
    print(f"Agent Root: {get_agent_root()}")
    print(f"Agent Source: {get_agent_source()}")
    print(f"Skills Path: {get_skills_path()}")
    print(f"Agents Path: {get_agents_path()}")
    print(f"Workflows Path: {get_workflows_path()}")
    print(f"Config Path: {get_config_path()}")
    print()
    print("Doc path resolution:")
    for name in DOC_PATHS:
        resolved = resolve_doc_path(name)
        status = str(resolved) if resolved else "(not found)"
        print(f"  {name}: {status}")
    print()
    print("Bootstrap check (detect-only):")
    import json as _json
    print(_json.dumps(ensure_docs_structure(create_if_missing=False), indent=2))
