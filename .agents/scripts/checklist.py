#!/usr/bin/env python3
"""
Master Checklist Runner - Inove AI Framework
=============================================

Orchestrates all validation scripts in priority order.
Use this for incremental validation during development.

Usage:
    python scripts/checklist.py .                    # Run core checks
    python scripts/checklist.py . --url <URL>        # Include performance checks

Priority Order:
    P0: Security Scan (vulnerabilities, secrets)
    P1: Lint & Type Check (code quality)
    P2: Schema Validation (if database exists)
    P3: Test Runner (unit/integration tests)
    P4: UX Audit (psychology laws, accessibility)
    P5: SEO Check (meta tags, structure)
    P6: Performance (lighthouse - requires URL)
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from _check_runner import (
    print_header, print_error, print_warning,
    run_script_check, run_check, print_summary
)
from recovery import with_retry

# Core checks (Python scripts relative to project root)
CORE_CHECKS = [
    ("Framework Validation", ".agents/scripts/validate_installation.py", True),
    ("Traceability Check", ".agents/scripts/validate_traceability.py", False),
]

# Web-specific checks (run if web/ directory exists)
WEB_CHECKS = [
    ("TypeScript Check", ["npx", "tsc", "--noEmit"], True),
    ("Lint Check", ["npm", "run", "lint"], False),
    ("Build Check", ["npm", "run", "build"], False),
]


def main():
    parser = argparse.ArgumentParser(
        description="Run Inove AI Framework validation checklist",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/checklist.py .                      # Core checks only
  python scripts/checklist.py . --url http://localhost:3000  # Include performance
        """
    )
    parser.add_argument("project", help="Project path to validate")
    parser.add_argument("--url", help="URL for performance checks (lighthouse, playwright)")
    parser.add_argument("--skip-performance", action="store_true", help="Skip performance checks even if URL provided")

    args = parser.parse_args()

    project_path = Path(args.project).resolve()

    if not project_path.exists():
        print_error(f"Project path does not exist: {project_path}")
        sys.exit(1)

    print_header("INOVE AI FRAMEWORK - MASTER CHECKLIST")
    print(f"Project: {project_path}")
    print(f"URL: {args.url if args.url else 'Not provided (performance checks skipped)'}")

    results = []

    # Run core checks (Python scripts) with retry for timeout-prone checks
    print_header("CORE CHECKS")
    for name, script_rel, required in CORE_CHECKS:
        script = project_path / script_rel

        @with_retry(max_attempts=2, backoff=2, exceptions=(Exception,))
        def _run_check(n=name, s=script):
            return run_script_check(n, s, str(project_path))

        result = _run_check()
        results.append(result)

        if required and not result["passed"] and not result.get("skipped"):
            print_error(f"CRITICAL: {name} failed. Stopping checklist.")
            print_header("CHECKLIST SUMMARY")
            print_summary(results)
            sys.exit(1)

    # Run web checks if web/ directory exists
    web_dir = project_path / "web"
    if web_dir.exists() and (web_dir / "package.json").exists():
        print_header("WEB CHECKS")
        for name, cmd, required in WEB_CHECKS:
            result = run_check(name, cmd, str(web_dir))
            results.append(result)

            if required and not result["passed"] and not result.get("skipped"):
                print_error(f"CRITICAL: {name} failed. Stopping checklist.")
                print_header("CHECKLIST SUMMARY")
                print_summary(results)
                sys.exit(1)

    # Print summary
    print_header("CHECKLIST SUMMARY")
    all_passed = print_summary(results)

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
