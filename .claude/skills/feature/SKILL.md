---
name: feature
description: Manage the feature workflow around context/current-feature.md. Actions - load (put a spec or text into current-feature.md), start (branch and implement), explain (walk through the implemented code), finish (commit, push, merge, delete branch, reset current-feature.md).
argument-hint: load <spec path or text> | start | explain | finish
---

# Feature workflow

Run the action given as the first argument by reading its file and following it. Follow `context/ai-interactions.md` and `context/coding-standards.md` throughout.

| Action    | Instructions                       |
| --------- | ---------------------------------- |
| `load`    | [load.md](load.md)                 |
| `start`   | [start.md](start.md)               |
| `explain` | [explain.md](explain.md)           |
| `finish`  | [finish.md](finish.md)             |

If no action or an unknown one is given, list the four actions and stop.
