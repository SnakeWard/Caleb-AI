# Caleb AI V1 Demo Fixtures

These files are safe static JSON inputs for the Caleb AI V1 CLI demo.

They are used by `npm run cli -- run-hollow ...` commands to prove that explicit Hollow execution can move through:

```text
CLI -> V1 Hollow Catalog -> Hollow Registry -> Hollow Runner -> Verified Return Path
```

The code-like strings in these fixtures are data only. They are not executed, scanned from the repository, or passed to a shell.

Generated runtime outputs, including Ledger JSONL files and report files, should go to `.caleb/` during manual local use or to temporary directories during tests. They should not be committed as runtime state.
