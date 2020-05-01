import { selectAll, select } from 'd3-selection'
import './format'
import './ui/navbar'
import TerritoryChart from './chart/Territory'
import RegionChart from './chart/Region'
import './style/main.scss'

const regionChart = new RegionChart('region-chart')
const territoryChart = new TerritoryChart('territory-chart', regionChart)

selectAll('.showTypeBtn')
  .on('click', function() {
    const type = this.dataset.value
    selectAll('.showTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === type)
      })
    territoryChart.setType(type)
  })

selectAll('.setViewBtn')
  .on('click', function() {
    const view = this.dataset.value
    if (view === 'full') {
      territoryChart.setFullProjection()
    }
    if (view === 'europe') {
      territoryChart.setEuropeProjection()
    }
  })

selectAll('.regionTypeBtn')
  .on('click', function() {
    const type = this.dataset.value
    selectAll('.regionTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === type)
      })
    regionChart.setType(type)
  })
