# Policy

`runs-on.dev` is a free subdomain registry. Anyone with a GitHub account can
claim a name like `you.runs-on.dev` and point it at their own hosting. This
page explains the terms in plain language.

## Names are free, and may be reclaimed

Claiming a name costs nothing, and there is no guarantee it stays yours
forever. Advance Labs reserves the right to reclaim any name, including a
name that has gone dormant (no working site, an expired record, an inactive
owner). Free registries only stay usable if abandoned names come back into
circulation.

## What forfeits a name immediately

The following forfeit a name on sight, no warning required:

- **Impersonation**: pretending to be a person, brand, or organization you
  are not.
- **Phishing**: pages designed to steal credentials, payment details, or
  other sensitive information.
- **Malware**: serving or distributing malicious software.
- **Illegal content**: anything unlawful to host or distribute.

If your name is doing any of these, expect it to be pulled without notice.
A maintainer removes it by deleting its `domains/<name>.json` file in a
pull request; owners can release a name the same way. See
[README.md](./README.md#what-ci-enforces) for the mechanics.

## Who is responsible

Advance Labs is the registrant of `runs-on.dev` and answers for what every
subdomain serves. That is why the policy above exists and why it is
enforced without much ceremony: the registrant is on the hook for abuse
happening under the domain, so abuse gets removed.

## Reporting abuse

Email **abuse@runs-on.dev** with the subdomain in question and what it is
doing. Reports are how dormant and abusive names get found. Use it.
