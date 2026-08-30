# Contributing to ecommerce-skills

Issues and pull requests are welcome. This file covers how to get the project
running locally and what a pull request is expected to carry.

## Local development

Requires Node.js 20 or newer (see `engines` in `package.json`) and Python 3 —
`npm test` runs a Node suite and a Python suite.

```bash
git clone https://github.com/dlazyai/ecommerce-skills
cd ecommerce-skills
npm install
npm test
```

## Before opening a pull request

- Run `npm test` and make sure it passes.
- Keep the change focused: one concern per pull request is easier to review
  and easier to revert.
- If the behaviour changed, update the README in the same commit. Documentation
  that lags behind the code is worse than no documentation.

## Reporting a bug

Open an issue with the version you are running and the smallest set of steps
that reproduces the problem. A report without a reproduction usually costs a
few round trips before triage can even start.
