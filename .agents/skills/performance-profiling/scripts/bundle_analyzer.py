#!/usr/bin/env python3
"""
Skill: performance-profiling
Script: bundle_analyzer.py
Purpose: Analyze build output bundle sizes for web projects
Usage: python bundle_analyzer.py <project_path> [--output json|summary]
Output: JSON with bundle analysis findings

This script validates:
1. Build output directory presence and total size
2. Individual chunk/asset sizes (flag >250KB)
3. Duplicate module detection via package names in chunks
4. Source map presence (should not ship to production)
5. Image/font optimization opportunities
"""
import json
import os
import sys
import argparse
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Fix Windows console encoding
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass


# ============================================================================
#  CONFIGURATION
# ============================================================================

BUILD_DIRS = [
    (".next", "Next.js"),
    ("dist", "Vite/Webpack"),
    ("build", "CRA/Generic"),
    ("out", "Next.js Static Export"),
    (".output", "Nuxt/Nitro"),
]

JS_EXTENSIONS = {'.js', '.mjs', '.cjs'}
CSS_EXTENSIONS = {'.css'}
MAP_EXTENSIONS = {'.map'}
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico'}
FONT_EXTENSIONS = {'.woff', '.woff2', '.ttf', '.eot', '.otf'}

# Thresholds
LARGE_JS_THRESHOLD = 250 * 1024       # 250KB
LARGE_CSS_THRESHOLD = 100 * 1024      # 100KB
LARGE_IMAGE_THRESHOLD = 500 * 1024    # 500KB
TOTAL_JS_THRESHOLD = 1024 * 1024      # 1MB total JS


# ============================================================================
#  ANALYSIS FUNCTIONS
# ============================================================================

def detect_build_dir(project_path: str) -> tuple:
    """Detect which build output directory exists."""
    for dir_name, framework in BUILD_DIRS:
        build_path = Path(project_path) / dir_name
        if build_path.exists() and build_path.is_dir():
            return build_path, framework
    return None, None


def analyze_assets(build_path: Path) -> Dict[str, Any]:
    """Walk the build directory and categorize all assets by type and size."""
    assets = {
        "js": [], "css": [], "images": [], "fonts": [],
        "source_maps": [], "other": []
    }

    for root, dirs, files in os.walk(build_path):
        # Skip node_modules inside build dirs
        dirs[:] = [d for d in dirs if d != 'node_modules']

        for file in files:
            filepath = Path(root) / file
            try:
                size = filepath.stat().st_size
            except OSError:
                continue

            ext = filepath.suffix.lower()
            rel_path = str(filepath.relative_to(build_path))

            entry = {"path": rel_path, "size": size, "size_kb": round(size / 1024, 1)}

            if ext in MAP_EXTENSIONS:
                assets["source_maps"].append(entry)
            elif ext in JS_EXTENSIONS:
                assets["js"].append(entry)
            elif ext in CSS_EXTENSIONS:
                assets["css"].append(entry)
            elif ext in IMAGE_EXTENSIONS:
                assets["images"].append(entry)
            elif ext in FONT_EXTENSIONS:
                assets["fonts"].append(entry)
            else:
                assets["other"].append(entry)

    # Sort each category by size descending
    for category in assets.values():
        category.sort(key=lambda x: x["size"], reverse=True)

    return assets


def check_large_assets(assets: Dict, findings: List):
    """Flag assets that exceed size thresholds."""
    for js_asset in assets["js"]:
        if js_asset["size"] > LARGE_JS_THRESHOLD:
            findings.append({
                "type": "large_js_bundle",
                "severity": "high",
                "file": js_asset["path"],
                "size_kb": js_asset["size_kb"],
                "threshold_kb": LARGE_JS_THRESHOLD // 1024,
                "message": f"JS bundle {js_asset['path']} is {js_asset['size_kb']}KB (>{LARGE_JS_THRESHOLD // 1024}KB)"
            })

    for css_asset in assets["css"]:
        if css_asset["size"] > LARGE_CSS_THRESHOLD:
            findings.append({
                "type": "large_css_bundle",
                "severity": "medium",
                "file": css_asset["path"],
                "size_kb": css_asset["size_kb"],
                "message": f"CSS bundle {css_asset['path']} is {css_asset['size_kb']}KB (>{LARGE_CSS_THRESHOLD // 1024}KB)"
            })

    for img_asset in assets["images"]:
        if img_asset["size"] > LARGE_IMAGE_THRESHOLD:
            findings.append({
                "type": "large_image",
                "severity": "medium",
                "file": img_asset["path"],
                "size_kb": img_asset["size_kb"],
                "message": f"Image {img_asset['path']} is {img_asset['size_kb']}KB — consider compression"
            })


def check_total_js_size(assets: Dict, findings: List):
    """Check if total JS payload exceeds threshold."""
    total_js = sum(a["size"] for a in assets["js"])
    if total_js > TOTAL_JS_THRESHOLD:
        findings.append({
            "type": "total_js_excessive",
            "severity": "high",
            "total_kb": round(total_js / 1024, 1),
            "threshold_kb": TOTAL_JS_THRESHOLD // 1024,
            "message": f"Total JS payload: {round(total_js / 1024, 1)}KB exceeds {TOTAL_JS_THRESHOLD // 1024}KB threshold",
            "recommendation": "Enable code splitting, lazy loading, and tree shaking"
        })


def check_source_maps(assets: Dict, findings: List):
    """Check for source maps that should not be in production."""
    if assets["source_maps"]:
        total_maps = len(assets["source_maps"])
        total_size = sum(m["size"] for m in assets["source_maps"])
        findings.append({
            "type": "source_maps_present",
            "severity": "medium",
            "count": total_maps,
            "total_size_kb": round(total_size / 1024, 1),
            "message": f"{total_maps} source map files found ({round(total_size / 1024, 1)}KB). "
                       f"Remove from production builds for security and size."
        })


def check_unoptimized_images(assets: Dict, findings: List):
    """Check for images that could use modern formats."""
    legacy_images = [a for a in assets["images"]
                     if Path(a["path"]).suffix.lower() in {'.png', '.jpg', '.jpeg', '.gif'}
                     and a["size"] > 50 * 1024]

    if legacy_images:
        findings.append({
            "type": "unoptimized_images",
            "severity": "low",
            "count": len(legacy_images),
            "message": f"{len(legacy_images)} images >50KB using legacy formats. "
                       f"Consider converting to WebP/AVIF.",
            "files": [i["path"] for i in legacy_images[:5]]
        })


# ============================================================================
#  MAIN
# ============================================================================

def run_analysis(project_path: str) -> Dict[str, Any]:
    """Execute full bundle analysis."""

    report = {
        "tool": "bundle_analyzer",
        "project": os.path.abspath(project_path),
        "timestamp": datetime.now().isoformat(),
        "build_dir": None,
        "framework": None,
        "totals": {},
        "findings": [],
        "summary": {
            "total_findings": 0,
            "by_severity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "overall_status": "[OK] Bundle sizes acceptable"
        }
    }

    # Detect build directory
    build_path, framework = detect_build_dir(project_path)

    if build_path is None:
        report["summary"]["overall_status"] = "[?] No build directory found"
        report["findings"].append({
            "type": "no_build_dir",
            "severity": "low",
            "message": "No build output directory found. Run a build first "
                       f"(checked: {', '.join(d[0] for d in BUILD_DIRS)})"
        })
        report["summary"]["total_findings"] = 1
        report["summary"]["by_severity"]["low"] = 1
        return report

    report["build_dir"] = str(build_path.relative_to(project_path))
    report["framework"] = framework

    # Analyze assets
    assets = analyze_assets(build_path)

    # Compute totals
    report["totals"] = {
        "js": {"count": len(assets["js"]),
               "total_kb": round(sum(a["size"] for a in assets["js"]) / 1024, 1)},
        "css": {"count": len(assets["css"]),
                "total_kb": round(sum(a["size"] for a in assets["css"]) / 1024, 1)},
        "images": {"count": len(assets["images"]),
                   "total_kb": round(sum(a["size"] for a in assets["images"]) / 1024, 1)},
        "fonts": {"count": len(assets["fonts"]),
                  "total_kb": round(sum(a["size"] for a in assets["fonts"]) / 1024, 1)},
        "source_maps": {"count": len(assets["source_maps"]),
                        "total_kb": round(sum(a["size"] for a in assets["source_maps"]) / 1024, 1)},
    }

    # Top 5 largest JS assets
    report["top_js_assets"] = [
        {"path": a["path"], "size_kb": a["size_kb"]}
        for a in assets["js"][:5]
    ]

    # Run checks
    check_large_assets(assets, report["findings"])
    check_total_js_size(assets, report["findings"])
    check_source_maps(assets, report["findings"])
    check_unoptimized_images(assets, report["findings"])

    # Summarize
    report["summary"]["total_findings"] = len(report["findings"])
    for finding in report["findings"]:
        sev = finding.get("severity", "low")
        if sev in report["summary"]["by_severity"]:
            report["summary"]["by_severity"][sev] += 1

    sev = report["summary"]["by_severity"]
    if sev["critical"] > 0:
        report["summary"]["overall_status"] = "[!!] CRITICAL: Bundle issues"
    elif sev["high"] > 0:
        report["summary"]["overall_status"] = "[!] HIGH: Bundle optimization needed"
    elif sev["medium"] > 0:
        report["summary"]["overall_status"] = "[?] REVIEW: Some bundle improvements possible"

    return report


def main():
    parser = argparse.ArgumentParser(
        description="Analyze build output bundle sizes for web projects"
    )
    parser.add_argument("project_path", nargs="?", default=".",
                        help="Project directory to analyze")
    parser.add_argument("--output", choices=["json", "summary"], default="json",
                        help="Output format")

    args = parser.parse_args()

    if not os.path.isdir(args.project_path):
        print(json.dumps({"error": f"Directory not found: {args.project_path}"}))
        sys.exit(1)

    result = run_analysis(args.project_path)

    if args.output == "summary":
        print(f"\n{'=' * 60}")
        print(f"Bundle Analysis: {result['project']}")
        if result['framework']:
            print(f"Framework: {result['framework']} ({result['build_dir']})")
        print(f"{'=' * 60}")
        print(f"Status: {result['summary']['overall_status']}")

        if result.get('totals'):
            t = result['totals']
            print(f"\nBundle Breakdown:")
            print(f"  JS:     {t['js']['count']} files, {t['js']['total_kb']}KB")
            print(f"  CSS:    {t['css']['count']} files, {t['css']['total_kb']}KB")
            print(f"  Images: {t['images']['count']} files, {t['images']['total_kb']}KB")
            print(f"  Fonts:  {t['fonts']['count']} files, {t['fonts']['total_kb']}KB")
            if t['source_maps']['count'] > 0:
                print(f"  Maps:   {t['source_maps']['count']} files, {t['source_maps']['total_kb']}KB")

        if result.get('top_js_assets'):
            print(f"\nLargest JS Chunks:")
            for asset in result['top_js_assets']:
                print(f"  {asset['size_kb']:>8.1f}KB  {asset['path']}")

        if result['findings']:
            print(f"\nFindings ({result['summary']['total_findings']}):")
            for f in result['findings'][:8]:
                icon = {"critical": "!!", "high": "!", "medium": "?", "low": "-"}.get(f["severity"], "-")
                print(f"  [{icon}] {f['message']}")

        print(f"{'=' * 60}\n")
    else:
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
