# API specification

Existing routes are preserved. V2 adds protected admin routes for customer updates, documents, PDF download, payments, follow-ups, settings, and user roles, plus `/api/cron/reminders`. Admin mutation routes return JSON and use 400 for invalid input, 403 for authorization, 404 for missing records, and 409 for state conflicts. The cron route requires `Authorization: Bearer $CRON_SECRET`.
