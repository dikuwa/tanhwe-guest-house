// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e90f9a1ea66d3861e83e00633160f9ff@o4511617892745216.ingest.de.sentry.io/4511617902051408",

  // Sample 10% of traces to control cost
  tracesSampleRate: 0.1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Do not send user PII (Personally Identifiable Information) to protect customer privacy
  sendDefaultPii: false,
});
