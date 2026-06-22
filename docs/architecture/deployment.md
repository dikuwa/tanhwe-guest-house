# File: architecture/deployment.md

# Deployment Architecture

## MVP Deployment

- Vercel for Next.js app
- Neon for PostgreSQL
- Cloudflare R2 for room images and generated documents
- Resend for email
- Sentry for error tracking

## Optional Self-Hosted Deployment

Use:

- Docker
- Docker Compose
- Coolify
- PostgreSQL
- MinIO for storage
- Resend/Postmark for email

Only use this if the owner wants self-hosting or lower long-term infrastructure control.
