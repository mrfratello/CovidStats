import { timeParse, timeFormat } from 'd3-time-format'

export const serverToDate = timeParse('%Y-%m-%dT%H:%M:%S.%L%Z')
export const serverShortToDate = timeParse('%Y-%m-%d')
export const shortDate = timeFormat('%b, %e %Y')
export const fullDate = timeFormat('%H:%M, %e %B')
export const cacheDate = timeFormat('%Y_%m_%d_%H')
export const serverDate = timeFormat('%Y-%m-%d')
