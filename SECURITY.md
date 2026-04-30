# Security Policy

## Reporting a vulnerability

Email: **security@brainarena.fun**

Do **not** open public GitHub issues for security bugs — this gives
attackers a chance to exploit the issue before a fix ships.

If the issue is sensitive (account takeover, RCE, data exposure), please
use PGP if you have it. Otherwise plain email is fine — the inbox is
monitored daily.

## Supported versions

Only the deployed production version (https://brainarena.fun) is
supported. There are no LTS branches.

## Response time

- Acknowledgment within **72 hours**.
- Severity assessment within **5 business days**.
- Fix timeline depends on severity:
  - **Critical** (RCE, full data exfil): hot-patch within 24 h.
  - **High** (auth bypass, privilege escalation): patch within 7 days.
  - **Medium / Low**: rolled into the next regular release.

## Scope

In scope:
- The deployed app at brainarena.fun (and www. variant)
- API routes under `/api/*`
- Leaderboard data integrity
- Anything that handles user input or third-party scripts

Out of scope:
- Third-party scripts (AdSense, Plausible) — report directly to those
  vendors.
- Social-engineering attacks against staff.
- DoS / resource-exhaustion attacks (we use rate-limiting at the edge).

## What we ask

- Don't access data that isn't yours.
- Don't disrupt other users (no DoS, no spam, no scraping at scale).
- Give us reasonable time to fix before public disclosure (90 days is
  typical).

Thank you for keeping BrainArena's players safe.
