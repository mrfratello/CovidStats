import { select } from 'd3-selection'

const navbarCollapse = select('.navbar-collapse')

select('.navbar-toggler').on('click', () => {
  navbarCollapse.classed('show', !navbarCollapse.node().matches('.show'))
})
