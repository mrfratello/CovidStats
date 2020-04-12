import { transition } from 'd3-transition'
import { easeCubicOut } from 'd3-ease'

export const DURATION = 500

export const barTransition = transition()
  .ease(easeCubicOut)
  .duration(DURATION)

export default barTransition
