#!/usr/bin/env python3
"""
Setup N8N MCP - Helper Script
==============================
Injects or updates the n8n-mcp configuration inside the user's MCP config files securely.
"""
import sys
import json
import os
import shutil
from pathlib import Path

# Common config paths
CONFIG_PATHS = [
    Path.home() / ".config" / "windsurf" / "mcp_config.json",
    Path.home() / ".claude" / "mcp_config.json",
    Path.home() / "Library" / "Application Support" / "Claude" / "claude_desktop_config.json"
]

def find_mcp_config():
    for p in CONFIG_PATHS:
        if p.exists():
            return p
    return None

def update_config(filepath, api_url, api_key):
    # Backup
    backup_path = filepath.with_name(filepath.name + ".bak")
    shutil.copy2(filepath, backup_path)
    
    try:
        data = json.loads(filepath.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        data = {"mcpServers": {}}
        
    if "mcpServers" not in data:
        data["mcpServers"] = {}
        
    # Inject npx version
    data["mcpServers"]["n8n-mcp"] = {
        "command": "npx",
        "args": ["-y", "n8n-mcp"],
        "env": {
            "N8N_API_URL": api_url,
            "N8N_API_KEY": api_key,
            "MCP_MODE": "stdio",
            "LOG_LEVEL": "error",
            "DISABLE_CONSOLE_OUTPUT": "true"
        }
    }
    
    filepath.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Success! n8n-mcp configured in {filepath}")
    print(f"Backup saved to {backup_path}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python setup_n8n_mcp.py <N8N_API_URL> <N8N_API_KEY>")
        sys.exit(1)
        
    api_url = sys.argv[1].rstrip("/")
    api_key = sys.argv[2]
    
    config_file = find_mcp_config()
    if config_file:
        update_config(config_file, api_url, api_key)
    else:
        print("❌ Could not find a supported MCP configuration file. Please configure manually.")

if __name__ == "__main__":
    main()
