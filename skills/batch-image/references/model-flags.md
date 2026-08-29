# `seedream-5.0` 参数清单

本技能默认用的模型的完整参数。日常只需要「参数约定」里那几个，
这份清单在需要用到非常规参数时再看。

**CRITICAL INSTRUCTION FOR AGENT**:
Run the `dlazy seedream-5.0` command to get results.

```bash
dlazy seedream-5.0 -h

Options:
  --prompt <prompt>          Prompt
  --images [images...]       Images [image: url or local path] (max 10)
  --resolution <resolution>  Resolution [default: 2k] (choices: "2k", "3k",
                             "4k")
  --size <size>              Size [default: 16:9] (choices: "1:1", "4:3",
                             "3:4", "16:9", "9:16", "3:2", "2:3", "21:9")
  --dry-run                  Print payload without executing the tool
  --no-wait                  Return generateId immediately for async tasks
  --timeout <seconds>        Max seconds to wait for async completion (default:
                             "1800")
  --input <jsonOrFile>       Inline JSON or @path/to/file.json — merged under
                             flag values (flags win)
  --save <path>              Download the result asset to this local path
                             (mkdir + retry handled for you). A destination
                             path — NOT a response format; for stdout shape use
                             --format
  --batch <n>                Fan-out N parallel runs (cloud tools only)
                             (default: "1")
  -h, --help                 display help for command
```

> Any flag also accepts pipe references — `-` (auto-pick from upstream stdin), `@N` (n-th output), `@N.path` (jsonpath into output), `@*` (all primary values), `@stdin` / `@stdin:path` (whole envelope). See `dlazy --help` for details.

---

换其他后端时参数由 `scripts/gen.mjs` 统一翻译，见 [`provider-cli.md`](provider-cli.md)。
