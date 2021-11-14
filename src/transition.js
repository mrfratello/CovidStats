import { easeCubicOut } from 'd3-ease'
import { interpolateRgb } from 'd3-interpolate'
import { transition } from 'd3-transition'

export const DURATION = 500

export const barTransition = transition('base')
  .ease(easeCubicOut)
  .duration(DURATION)

export const casesColor = interpolateRgb('#fffaec', '#ffcc00')

export default barTransition
