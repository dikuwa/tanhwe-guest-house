# Backup and restore

## Neon PostgreSQL

Neon branching provides isolated copy-on-write database clones without adding load to the parent branch. Before risky migrations, create a dated branch from production, apply and test the migration there, then retain the branch through the deployment window.

For data loss, first use Neon Time Travel Assist or a historical branch to inspect the intended recovery point. Neon instant restore is a root-branch overwrite, not a merge, and temporarily interrupts connections. It automatically preserves the pre-restore state in a backup branch. Confirm the project history-window setting in the Neon console before relying on a specific recovery period.

Official references:

- https://neon.com/docs/introduction/branching
- https://neon.com/docs/introduction/branch-restore

## Application rollback

1. Identify the last known-good Vercel deployment.
2. If the database change is backward compatible, use `vercel rollback <deployment-id>` or promote the known-good deployment.
3. If data recovery is required, stop writes, inspect a Neon historical branch, record the exact restore timestamp, and obtain owner confirmation before instant restore.
4. Smoke-test public pages, login, availability, booking requests, and admin operations after rollback.

## Cloudflare R2

Room-image deletion is an application action, so database and object recovery must be planned together. Enable an appropriate R2 lifecycle/versioning or external backup policy in Cloudflare according to the account plan. Retain `R2_LEGACY_PUBLIC_URL` while moving to a custom asset domain. Periodically export the room-image object listing and compare it with `room_images.image_url` records. DNS, lifecycle, and restore testing require Cloudflare account access.
