# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest release on `main` | ✅ |
| Older tags | ❌ (upgrade recommended) |

Current app version is declared in `frontend/package.json` and shown in the site footer.

## Reporting a vulnerability

**Please do not open public GitHub Issues for security vulnerabilities.**

1. Use [GitHub Private Security Advisories](https://github.com/dithmarpatpar300-lgtm/camaleon/security/advisories/new) (preferred), **or**
2. Open a [Security issue](https://github.com/dithmarpatpar300-lgtm/camaleon/issues/new?template=security.yml) with minimal public detail and ask for private follow-up.

We will acknowledge within **72 hours** and aim to provide a fix or mitigation plan within **14 days** for confirmed issues.

## Scope

**In scope**

- Camaleon web application (Next.js frontend deployed on Cloudflare Workers)
- Rust/Wasm transmutation modules served as static assets
- Supply-chain issues in declared dependencies (npm, Cargo)
- Misconfigurations that expose data or break the local-only privacy model

**Out of scope**

- Denial-of-service against Cloudflare infrastructure (report to Cloudflare)
- Issues in third-party browsers or OS image codecs
- Social engineering
- Vulnerabilities in forked/cloned sites not operated by us

## Privacy model

Camaleon processes images **entirely in the user's browser**. We do not operate a file conversion API. Reports should focus on cases where file data could leave the client unintentionally, or where the deployed site behaves differently from the open-source code.

## Safe harbor

We support good-faith security research. Do not access other users' data (there is none on our servers), degrade service for others, or publicly disclose before we have had reasonable time to respond.

## Recognition

Contributors who report valid, previously unknown issues may be credited in release notes at their request.
