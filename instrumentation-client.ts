// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://e90f9a1ea66d3861e83e00633160f9ff@o4511617892745216.ingest.de.sentry.io/4511617902051408",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Sample 10% of traces to control cost
  tracesSampleRate: 0.1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Disable session replays in production to protect customer data privacy
  replaysSessionSampleRate: 0,

  // Only capture replays on error, not all sessions
  replaysOnErrorSampleRate: 1.0,

  // Do not send user PII (Personally Identifiable Information) to protect customer privacy
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
