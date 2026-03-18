#!/usr/bin/env python3
"""
Shared Check Runner - Inove AI Framework
=========================================
Common utilities for checklist.py and verify_all.py.
Provides Colors, print helpers, and check execution logic.
"""

import sys
import subprocess
from pathlib import Path
from datetime import datetime
from typing import List, Optional


class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_header(text: str, width: int = 60):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'=' * width}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(width)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'=' * width}{Colors.ENDC}\n")


def print_step(text: str):
    print(f"{Colors.BOLD}{Colors.BLUE}🔄 {text}{Colors.ENDC}")


def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")


def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")


def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")


def run_check(name: str, cmd: list, cwd: str, timeout: int = 300) -> dict:
    """
    Run a validation command and capture results.

    Args:
        name: Display name for the check
        cmd: Command list for subprocess.run
        cwd: Working directory
        timeout: Timeout in seconds (default 5 minutes)

    Returns:
        dict with keys: name, passed, output, error, skipped, duration
    """
    print_step(f"Running: {name}")
    start_time = datetime.now()

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=cwd
        )

        duration = (datetime.now() - start_time).total_seconds()
        passed = result.returncode == 0

        if passed:
            print_success(f"{name}: PASSED ({duration:.1f}s)")
        else:
            print_error(f"{name}: FAILED ({duration:.1f}s)")
            if result.stderr:
                print(f"  Error: {result.stderr[:300]}")

        return {
            "name": name,
            "passed": passed,
            "output": result.stdout,
            "error": result.stderr,
            "skipped": False,
            "duration": duration
        }

    except subprocess.TimeoutExpired:
        duration = (datetime.now() - start_time).total_seconds()
        print_error(f"{name}: TIMEOUT (>{duration:.0f}s)")
        return {"name": name, "passed": False, "output": "", "error": "Timeout",
                "skipped": False, "duration": duration}

    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        print_error(f"{name}: ERROR - {str(e)}")
        return {"name": name, "passed": False, "output": "", "error": str(e),
                "skipped": False, "duration": duration}


def run_script_check(name: str, script_path: Path, project_path: str,
                     timeout: int = 300) -> dict:
    """
    Run a Python script check.

    Args:
        name: Display name
        script_path: Path to the Python script
        project_path: Working directory
        timeout: Timeout in seconds

    Returns:
        Result dict (same format as run_check)
    """
    if not script_path.exists():
        print_warning(f"{name}: Script not found, skipping")
        return {"name": name, "passed": True, "output": "", "error": "",
                "skipped": True, "duration": 0}

    cmd = [sys.executable, str(script_path)]
    return run_check(name, cmd, project_path, timeout)


def print_summary(results: List[dict], show_duration: bool = False,
                  show_categories: bool = False) -> bool:
    """
    Print final summary report.

    Args:
        results: List of check result dicts
        show_duration: Include duration info per check
        show_categories: Group results by category

    Returns:
        True if all checks passed
    """
    passed_count = sum(1 for r in results if r["passed"] and not r.get("skipped"))
    failed_count = sum(1 for r in results if not r["passed"] and not r.get("skipped"))
    skipped_count = sum(1 for r in results if r.get("skipped"))

    print(f"Total Checks: {len(results)}")
    print(f"{Colors.GREEN}✅ Passed: {passed_count}{Colors.ENDC}")
    print(f"{Colors.RED}❌ Failed: {failed_count}{Colors.ENDC}")
    print(f"{Colors.YELLOW}⏭️  Skipped: {skipped_count}{Colors.ENDC}")
    print()

    if show_categories:
        current_category = None
        for r in results:
            if r.get("category") and r["category"] != current_category:
                current_category = r["category"]
                print(f"\n{Colors.BOLD}{Colors.CYAN}{current_category}:{Colors.ENDC}")
            _print_result_line(r, show_duration, indent="  ")
    else:
        for r in results:
            _print_result_line(r, show_duration)

    print()

    if failed_count > 0:
        print_error(f"{failed_count} check(s) FAILED - Please fix before proceeding")

        if show_categories:
            print(f"\n{Colors.BOLD}{Colors.RED}❌ FAILED CHECKS:{Colors.ENDC}")
            for r in results:
                if not r["passed"] and not r.get("skipped"):
                    print(f"\n{Colors.RED}✗ {r['name']}{Colors.ENDC}")
                    if r.get("error"):
                        print(f"  Error: {r['error'][:200]}")
            print()

        return False
    else:
        print_success("All checks PASSED")
        return True


def _print_result_line(r: dict, show_duration: bool = False, indent: str = ""):
    if r.get("skipped"):
        status = f"{Colors.YELLOW}⏭️ {Colors.ENDC}"
    elif r["passed"]:
        status = f"{Colors.GREEN}✅{Colors.ENDC}"
    else:
        status = f"{Colors.RED}❌{Colors.ENDC}"

    duration_str = ""
    if show_duration and not r.get("skipped") and r.get("duration"):
        duration_str = f" ({r['duration']:.1f}s)"

    print(f"{indent}{status} {r['name']}{duration_str}")
