import { selectAll, select } from 'd3-selection'
import './format'
import SimpleChart from './chart/Simple'
import './style/main.scss'

const simpleChart = new SimpleChart('#chart')

selectAll('.scaleTypeBtn')
  .on('click', function() {
    const scaleType = this.dataset.value
    selectAll('.scaleTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === scaleType)
      })
    simpleChart.setScaleType(scaleType)
  })

selectAll('.chartTypeBtn')
  .on('click', function() {
    const chartType = this.dataset.value
    selectAll('.chartTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === chartType)
      })
    selectAll('.typeDescription')
      .each(function() {
        select(this).classed('active', this.dataset.type === chartType)
      })
    simpleChart.setType(chartType)
  })
