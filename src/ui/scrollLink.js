import { selectAll, select } from 'd3-selection'

selectAll('.go-to-chart').on('click', function (event) {
  event.preventDefault()
  const id = select(this).attr('href')
  const top = select(id).node().offsetTop
  window.scrollTo({
    top,
    behavior: 'smooth',
  })
})
