import { getLCP, getFID, getCLS } from 'web-vitals'
import type { Metric } from 'web-vitals'

function sendToGoogleAnalytics({ name, delta, value, id }: Metric) {
  gtag('event', name, {
    value: delta,
    metric_id: id,
    metric_value: value,
    metric_delta: delta,
  })
}

getCLS(sendToGoogleAnalytics)
getFID(sendToGoogleAnalytics)
getLCP(sendToGoogleAnalytics)
