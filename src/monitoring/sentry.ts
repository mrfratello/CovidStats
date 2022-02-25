import * as Sentry from '@sentry/browser'
import { BrowserTracing } from '@sentry/tracing'
import { version } from '../../package.json'

Sentry.init({
  dsn: 'https://e7a02377388a4f4ba0b5306abc541d69@o1153501.ingest.sentry.io/6232621',
  release: `covid-stat@${version}`,
  environment: process.env.NODE_ENV ?? 'development',
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
})
