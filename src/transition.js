import { transition } from 'd3-transition'
import { easeCubicOut } from 'd3-ease'

export const barTransition = transition()
  .ease(easeCubicOut)
  .duration(500)

export default barTransition
