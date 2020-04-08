import { timeParse, timeFormat } from 'd3-time-format'

export const serverToDate = timeParse('%Y-%m-%dT%H:%M:%S.%L%Z')
export const shortDate = timeFormat('%b, %e')
export const fullDate = timeFormat('%H:%M, %e %B')
