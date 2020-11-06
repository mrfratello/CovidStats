import { select, selectAll, local } from 'd3-selection'

const active = local()
const dropdown = selectAll('.dropdown').each(function () {
  active.set(this, false)
  const container = select(this)
  const items = select(this)
    .selectAll('.dropdown-item')
    .on('click', function () {
      const current = this
      items.classed('active', function () {
        return this === current
      })
      container.node().dataset.value = current.dataset.value
      container.select('.dropdown-toggle').html(current.innerHTML)
      container.dispatch('change')
    })
})

dropdown.on('click', function () {
  const isActive = !active.get(this)
  const container = select(this)
  container.classed('show', isActive)
  container.select('.dropdown-toggle').classed('active', isActive)
  container.select('.dropdown-menu').classed('show', isActive)
  active.set(this, isActive)
})
