/**
 * Isolated Sentry bundle, built as a separate chunk (dist/zotlo-sentry.min.js)
 * and loaded on demand by Logger.loadSentry(). Exposed on window.__zotloSentry.
 *
 * Deliberately excludes integrations that patch page globals (GlobalHandlers,
 * BrowserApiErrors, Breadcrumbs, Replay): this SDK runs on third-party sites
 * that often have their own Sentry — we must never capture the host page's
 * errors or conflict with its SDK.
 */
export {
  BrowserClient,
  Scope,
  makeFetchTransport,
  defaultStackParser,
  dedupeIntegration,
  eventFiltersIntegration,
  functionToStringIntegration,
  linkedErrorsIntegration,
  httpContextIntegration,
} from '@sentry/browser';
