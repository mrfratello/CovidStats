import { selectAll, select, event } from 'd3-selection'

selectAll('.go-to-chart').on('click', function () {
  event.preventDefault()
  const id = select(this).attr('href')
  const top = select(id).node().offsetTop
  window.scrollTo({
    top,
    behavior: 'smooth',
  })
})
