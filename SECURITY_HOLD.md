# ChatMCP activation hold

This repository is held closed. The canonical source previously allowed all requests in `JwtAuthGuard`, disabled the agent guard for testing, and used temporary identities. That is unsafe to activate. This change supplies no replacement JWT or ownership contract.

The guard now denies every identity; agent, conversation, and tool controllers apply that deny guard. The orchestrator entrypoint stops before importing providers or application modules. Root and application build/start scripts, all application Dockerfiles, and both deployment workflows stop unconditionally. Both Fly configurations contain no public service, and the legacy Kubernetes web deployment has zero replicas. There is no environment flag to bypass the hold.

As verified on October 1, 2026, Fly app `chatmcp` machine `3d8d3d9dc91508` was stopped with zero services. Its immutable image was `sha256:0ba59c064b969db313319e4c933da77a9fa54ee78c2635143214f6bd6809c8c7` (Node 18.20.8, `node dist/main.js`). Registry build metadata matches the nested orchestrator Dockerfile, but there is no source-revision label or captured compiled-file manifest proving the exact deployed commit. This source change does not update, start, or probe the machine.

Before any activation, a separate reviewed change must:

1. Establish the deployed source/lock/build relationship, including immutable source and image attestations. Resolve the conflicting root and nested build paths.
2. Replace temporary or caller-supplied identities with validated authentication and resource ownership checks. Review streaming, conversations/messages, tools, and OAuth state/callback access. Do not simply remove this hold.
3. Test anonymous, malformed, foreign-owner, and callback denials before any model, database, or tool operation; test authorized behavior with isolated synthetic fixtures.
4. Audit frozen dependencies and upgrade the obsolete Node/runtime in isolation. The old nested Dockerfile uses an unfrozen `npm install`; neither its installed graph nor application compatibility is established by this change.
5. Require the `ChatMCP security containment` CI check and review/admin protections on `main`. Existing manual deploy credentials or external deployment mechanisms remain a separate administrative boundary.
6. Review an explicit release plan that preserves the stopped/no-ingress state until activation is approved. No saved public-service configuration should be restored automatically.

`npm run test:security` runs dependency-free synthetic/static containment checks. It does not install the legacy application or claim complete runtime security coverage. Prior bootstrap and scripts remain in Git history for deliberate restoration after review.
