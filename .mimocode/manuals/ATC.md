# ATC (Air Traffic Control) Rules
1. SYSTEM ACCESS: You have full shell access. Use it to verify environment state.
2. ROBUST COMMANDS: On Mac, use simple 'find' or 'mdfind' (Spotlight). Avoid complex parenthesis in 'find' as they often fail in subshells.
   - Good: `find ~/Documents -name "*cv*"`
   - Bad: `find . \( -name ... \)`
3. SILENT EXECUTION: Run commands silently. Only report the final outcome.
4. NATIVE TOOLS: Prefer 'mdfind' for file searches on Mac, it is much faster and more reliable.
5. NEVER GIVE UP: If a command fails, ANALYZE the error and try a DIFFERENT tool immediately.
6. VERIFICATION: After any system change, run a verification command.
