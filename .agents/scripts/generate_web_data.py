#!/usr/bin/env python3
"""
Web Data Generator - Inove AI Framework
========================================
Reads .agents/ markdown files (agents, skills, workflows) and generates
JSON data files for the web site to consume.

Usage:
    python3 .agents/scripts/generate_web_data.py
    python3 .agents/scripts/generate_web_data.py --out web/src/data
"""

import json
import re
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional


def parse_frontmatter(content: str) -> Dict[str, str]:
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}

    frontmatter = {}
    for line in match.group(1).strip().split('\n'):
        if ':' in line:
            key, _, value = line.partition(':')
            frontmatter[key.strip()] = value.strip()
    return frontmatter


def parse_agents(agents_dir: Path) -> List[Dict[str, Any]]:
    """Parse all agent markdown files."""
    agents = []
    for md_file in sorted(agents_dir.glob("*.md")):
        content = md_file.read_text(encoding='utf-8')
        fm = parse_frontmatter(content)
        if not fm:
            continue

        name = fm.get("name", md_file.stem)
        skills_str = fm.get("skills", "")
        tools_str = fm.get("tools", "")

        agents.append({
            "name": name,
            "description": fm.get("description", ""),
            "tools": [t.strip() for t in tools_str.split(",") if t.strip()],
            "skills": [s.strip() for s in skills_str.split(",") if s.strip()],
            "file": f".agents/agents/{md_file.name}",
        })

    return agents


def parse_skills(skills_dir: Path) -> List[Dict[str, Any]]:
    """Parse all skill SKILL.md files."""
    skills = []
    for skill_md in sorted(skills_dir.glob("*/SKILL.md")):
        content = skill_md.read_text(encoding='utf-8')
        fm = parse_frontmatter(content)
        if not fm:
            continue

        name = fm.get("name", skill_md.parent.name)
        tools_str = fm.get("allowed-tools", fm.get("tools", ""))

        skill_data = {
            "name": name,
            "description": fm.get("description", ""),
            "tools": [t.strip() for t in tools_str.split(",") if t.strip()],
            "file": f".agents/skills/{skill_md.parent.name}/SKILL.md",
        }

        if fm.get("version"):
            skill_data["version"] = fm["version"]
        if fm.get("priority"):
            skill_data["priority"] = fm["priority"]

        skills.append(skill_data)

    # Also check for sub-skills (e.g., game-development/2d-games/SKILL.md)
    for skill_md in sorted(skills_dir.glob("*/*/SKILL.md")):
        content = skill_md.read_text(encoding='utf-8')
        fm = parse_frontmatter(content)
        if not fm:
            continue

        parent_name = skill_md.parent.parent.name
        sub_name = skill_md.parent.name
        name = fm.get("name", f"{parent_name}/{sub_name}")
        tools_str = fm.get("allowed-tools", fm.get("tools", ""))

        skills.append({
            "name": name,
            "description": fm.get("description", ""),
            "tools": [t.strip() for t in tools_str.split(",") if t.strip()],
            "file": f".agents/skills/{parent_name}/{sub_name}/SKILL.md",
            "parent": parent_name,
        })

    return skills


def parse_workflows(workflows_dir: Path) -> List[Dict[str, Any]]:
    """Parse all workflow markdown files."""
    workflows = []
    for md_file in sorted(workflows_dir.glob("*.md")):
        content = md_file.read_text(encoding='utf-8')
        fm = parse_frontmatter(content)

        name = md_file.stem
        description = fm.get("description", "")

        # Extract usage example from content if present
        usage = ""
        usage_match = re.search(r'[Uu]sage[:\s]*\n\s*```\s*\n(.+?)\n\s*```', content)
        if not usage_match:
            usage_match = re.search(r'[Ee]xample[:\s]*\n\s*```\s*\n(.+?)\n\s*```', content)
        if usage_match:
            usage = usage_match.group(1).strip().split('\n')[0]

        workflows.append({
            "cmd": f"/{name}",
            "name": name,
            "description": description,
            "file": f".agents/workflows/{md_file.name}",
        })

    return workflows


def generate_summary(agents: list, skills: list, workflows: list) -> Dict[str, Any]:
    """Generate a summary/stats object."""
    return {
        "agents_count": len(agents),
        "skills_count": len(skills),
        "workflows_count": len(workflows),
        "agent_names": [a["name"] for a in agents],
        "skill_names": [s["name"] for s in skills],
        "workflow_commands": [w["cmd"] for w in workflows],
    }


def main():
    parser = argparse.ArgumentParser(description="Generate web JSON data from .agents/ markdown files")
    parser.add_argument("--out", default="web/src/data/generated",
                        help="Output directory for JSON files (default: web/src/data/generated)")
    parser.add_argument("--root", default=".", help="Project root (default: current directory)")

    args = parser.parse_args()
    root = Path(args.root).resolve()
    out_dir = root / args.out

    agents_dir = root / ".agents" / "agents"
    skills_dir = root / ".agents" / "skills"
    workflows_dir = root / ".agents" / "workflows"

    if not agents_dir.exists():
        print(f"Error: agents directory not found at {agents_dir}")
        return 1

    out_dir.mkdir(parents=True, exist_ok=True)

    # Parse all sources
    agents = parse_agents(agents_dir)
    skills = parse_skills(skills_dir)
    workflows = parse_workflows(workflows_dir)
    summary = generate_summary(agents, skills, workflows)

    # Write JSON files
    files_written = []
    for name, data in [
        ("agents.json", agents),
        ("skills.json", skills),
        ("workflows.json", workflows),
        ("summary.json", summary),
    ]:
        out_file = out_dir / name
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        files_written.append(str(out_file.relative_to(root)))

    print(f"Generated {len(files_written)} JSON files in {out_dir.relative_to(root)}/")
    print(f"  Agents: {len(agents)}")
    print(f"  Skills: {len(skills)}")
    print(f"  Workflows: {len(workflows)}")
    for f in files_written:
        print(f"  -> {f}")

    return 0


if __name__ == "__main__":
    exit(main())
