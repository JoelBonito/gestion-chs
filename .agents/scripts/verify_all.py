#!/usr/bin/env python3
"""
Full Verification Suite - Inove AI Framework
=============================================

Runs COMPLETE validation including all checks + performance + E2E.
Use this before deployment or major releases.

Usage:
    python scripts/verify_all.py .
    python scripts/verify_all.py . --stop-on-fail

Includes ALL checks:
    P0: Framework Integrity (Installation Validation)
    P1: Code Quality (TypeScript, Lint)
    P2: Build
    P3: Traceability
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from _check_runner import (
    print_header, print_error, print_warning,
    run_script_check, run_check, print_summary, Colors
)

# Complete verification suite organized by priority category
VERIFICATION_SUITE = [
    {
        "category": "Framework Integrity",
        "checks": [
            ("Installation Validation", ".agents/scripts/validate_installation.py", True),
        ]
    },
    {
        "category": "Code Quality",
        "web_checks": [
            ("TypeScript Check", ["npx", "tsc", "--noEmit"], True),
            ("Lint Check", ["npm", "run", "lint"], False),
        ]
    },
    {
        "category": "Build",
        "web_checks": [
            ("Build Check", ["npm", "run", "build"], True),
        ]
    },
    {
        "category": "Traceability",
        "checks": [
            ("Traceability Validation", ".agents/scripts/validate_traceability.py", False),
        ]
    },
]


def main():
    parser = argparse.ArgumentParser(
        description="Run complete Inove AI Framework verification suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/verify_all.py .
  python scripts/verify_all.py . --stop-on-fail
        """
    )
    parser.add_argument("project", help="Project path to validate")
    parser.add_argument("--url", help="URL for performance & E2E checks (optional)")
    parser.add_argument("--no-e2e", action="store_true", help="Skip E2E tests")
    parser.add_argument("--stop-on-fail", action="store_true", help="Stop on first failure")

    args = parser.parse_args()

    project_path = Path(args.project).resolve()

    if not project_path.exists():
        print_error(f"Project path does not exist: {project_path}")
        sys.exit(1)

    print_header("INOVE AI FRAMEWORK - FULL VERIFICATION SUITE", width=70)
    print(f"Project: {project_path}")
    print(f"URL: {args.url}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    start_time = datetime.now()
    results = []

    web_dir = project_path / "web"
    has_web = web_dir.exists() and (web_dir / "package.json").exists()

    for suite in VERIFICATION_SUITE:
        category = suite["category"]
        print_header(f"{category.upper()}", width=70)

        # Python script checks
        for name, script_rel, required in suite.get("checks", []):
            script = project_path / script_rel
            result = run_script_check(name, script, str(project_path), timeout=600)
            result["category"] = category
            results.append(result)

            if args.stop_on_fail and required and not result["passed"] and not result.get("skipped"):
                print_error(f"CRITICAL: {name} failed. Stopping verification.")
                _print_final_report(results, start_time)
                sys.exit(1)

        # Web checks (npm/npx commands in web/ dir)
        if has_web:
            for name, cmd, required in suite.get("web_checks", []):
                result = run_check(name, cmd, str(web_dir), timeout=300)
                result["category"] = category
                results.append(result)

                if args.stop_on_fail and required and not result["passed"] and not result.get("skipped"):
                    print_error(f"CRITICAL: {name} failed. Stopping verification.")
                    _print_final_report(results, start_time)
                    sys.exit(1)

    all_passed = _print_final_report(results, start_time)
    sys.exit(0 if all_passed else 1)


def _print_final_report(results, start_time) -> bool:
    total_duration = (datetime.now() - start_time).total_seconds()
    print_header("FULL VERIFICATION REPORT", width=70)
    print(f"Total Duration: {total_duration:.1f}s")
    return print_summary(results, show_duration=True, show_categories=True)


if __name__ == "__main__":
    main()
