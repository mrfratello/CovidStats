import { timeParse, timeFormat } from 'd3-time-format'

export const serverToDate = timeParse('%Y-%m-%dT%H:%M:%S.%LZ')
export const shortDate = timeFormat('%b, %e')
