# AGENTS.md — aac-remake

## SDLC (mandatory order, no shortcuts)

After any fix, follow this exact sequence:

1. **Fix** — make the code change locally. Do NOT commit yet.
2. **Deploy to test env**
   ```bash
   ./scripts/deploy.sh testing
   ```
3. **Test on test env URL** — https://aac-testing.nexvision.cc
   - Smoke-test the fix on the live testing URL.
   - If broken: fix again → repeat from step 2. Never proceed to prod.
4. **Deploy to prod** (only if test env is OK)
   ```bash
   ./scripts/deploy.sh prod
   ```
   - Live at https://aac.nexvision.cc
   - Rollback if prod breaks: `./scripts/deploy.sh rollback <vX.Y.Z>`
5. **Commit and push** — commit the fix + push branch/tags
   ```bash
   git add -A && git commit -m "<type>: <what>"
   git push origin HEAD
   git push origin --tags
   ```
   Note: `deploy.sh` auto-bumps `package.json` patch version and may already
   have committed/pushed that bump — include it, do not revert it.

## Rules

- Prod NEVER moves before test env is verified OK on its URL.
- `:testing` = disposable test builds; `:stable` = prod. Never edit tags directly.
- Check status anytime: `./scripts/deploy.sh status`
