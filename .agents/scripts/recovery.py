#!/usr/bin/env python3
"""
Recovery System - Inove AI Framework
=====================================
Provides retry, rollback, and checkpoint utilities for resilient script execution.

Usage as module:
    from recovery import with_retry, safe_execute, git_checkpoint, git_rollback

Usage standalone:
    python3 .agents/scripts/recovery.py checkpoint <label>
    python3 .agents/scripts/recovery.py rollback <label>
"""

import sys
import time
import subprocess
import functools
import logging
from pathlib import Path

logger = logging.getLogger("recovery")


def with_retry(fn=None, max_attempts=3, backoff=2, exceptions=(Exception,)):
    """
    Decorator/wrapper that retries a function with exponential backoff.

    Usage as decorator:
        @with_retry(max_attempts=3)
        def flaky_function():
            ...

    Usage as wrapper:
        result = with_retry(max_attempts=3)(lambda: run_something())()
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts:
                        wait = backoff ** (attempt - 1)
                        logger.warning(
                            "Attempt %d/%d failed: %s. Retrying in %ds...",
                            attempt, max_attempts, e, wait
                        )
                        time.sleep(wait)
                    else:
                        logger.error(
                            "All %d attempts failed. Last error: %s",
                            max_attempts, e
                        )
            raise last_exception
        return wrapper

    if fn is not None:
        # Called as @with_retry without parentheses
        return decorator(fn)
    return decorator


def safe_execute(command, rollback_fn=None, cwd=None, timeout=120):
    """
    Execute a shell command safely. If it fails, optionally run a rollback function.

    Args:
        command: Command string or list to execute
        rollback_fn: Optional callable to run on failure
        cwd: Working directory for the command
        timeout: Timeout in seconds (default 120)

    Returns:
        subprocess.CompletedProcess on success

    Raises:
        subprocess.CalledProcessError on failure (after rollback)
    """
    if isinstance(command, str):
        cmd_display = command
        shell = True
    else:
        cmd_display = " ".join(command)
        shell = False

    logger.info("Executing: %s", cmd_display)

    try:
        result = subprocess.run(
            command,
            shell=shell,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            raise subprocess.CalledProcessError(
                result.returncode, cmd_display,
                output=result.stdout, stderr=result.stderr
            )
        return result
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        logger.error("Command failed: %s", e)
        if rollback_fn:
            logger.info("Running rollback...")
            try:
                rollback_fn()
                logger.info("Rollback completed successfully.")
            except Exception as rollback_error:
                logger.error("Rollback also failed: %s", rollback_error)
        raise


def git_checkpoint(label):
    """
    Create a git stash checkpoint before risky operations.

    Args:
        label: Label for the checkpoint (used in stash message)

    Returns:
        True if stash was created, False if working tree was clean
    """
    try:
        # Check if there are changes to stash
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True, text=True, check=True
        )
        if not result.stdout.strip():
            logger.info("Checkpoint '%s': working tree clean, nothing to stash.", label)
            return False

        subprocess.run(
            ["git", "stash", "push", "-m", f"recovery-checkpoint: {label}"],
            capture_output=True, text=True, check=True
        )
        logger.info("Checkpoint '%s' created.", label)
        return True
    except subprocess.CalledProcessError as e:
        logger.warning("Failed to create checkpoint '%s': %s", label, e)
        return False


def git_rollback(label):
    """
    Restore to a previously created checkpoint.

    Args:
        label: Label of the checkpoint to restore

    Returns:
        True if rollback succeeded, False otherwise
    """
    try:
        # Find the stash with our label
        result = subprocess.run(
            ["git", "stash", "list"],
            capture_output=True, text=True, check=True
        )

        target_msg = f"recovery-checkpoint: {label}"
        stash_ref = None
        for line in result.stdout.splitlines():
            if target_msg in line:
                stash_ref = line.split(":")[0]
                break

        if not stash_ref:
            logger.warning("Checkpoint '%s' not found in stash list.", label)
            return False

        subprocess.run(
            ["git", "stash", "pop", stash_ref],
            capture_output=True, text=True, check=True
        )
        logger.info("Rolled back to checkpoint '%s'.", label)
        return True
    except subprocess.CalledProcessError as e:
        logger.error("Failed to rollback to '%s': %s", label, e)
        return False


def main():
    """CLI interface for checkpoint/rollback operations."""
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python recovery.py checkpoint <label>  # Create checkpoint")
        print("  python recovery.py rollback <label>    # Restore checkpoint")
        sys.exit(1)

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    action = sys.argv[1]
    label = sys.argv[2]

    if action == "checkpoint":
        created = git_checkpoint(label)
        if created:
            print(f"Checkpoint '{label}' created.")
        else:
            print(f"No changes to checkpoint (working tree clean).")
    elif action == "rollback":
        restored = git_rollback(label)
        if restored:
            print(f"Rolled back to checkpoint '{label}'.")
        else:
            print(f"Checkpoint '{label}' not found.")
            sys.exit(1)
    else:
        print(f"Unknown action: {action}")
        sys.exit(1)


if __name__ == "__main__":
    main()
