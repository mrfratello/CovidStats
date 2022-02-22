import { easeCubicOut } from 'd3-ease'
import { transition } from 'd3-transition'

export const DURATION = 500

export const barTransition = transition('base')
  .ease(easeCubicOut)
  .duration(DURATION)

export default barTransition
