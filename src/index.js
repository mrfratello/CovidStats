import { selectAll, select } from 'd3-selection'
import './format'
import Chart from './Chart'
import './style/main.scss'

const chart = new Chart('#chart')

selectAll('[name=type]')
  .on('change', function() {
    chart.setType(this.value)
  })

selectAll('.scaleTypeBtn')
  .on('click', function() {
    const scaleType = this.dataset.value
    selectAll('.scaleTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === scaleType)
      })
    chart.setScaleType(scaleType)
  })
