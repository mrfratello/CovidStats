import { selectAll, select } from 'd3-selection'
import './format'
import './ui/navbar'
import TerritoryChart from './chart/Territory'
import './style/main.scss'

const territoryChart = new TerritoryChart('territory-chart')

selectAll('.showTypeBtn')
  .on('click', function() {
    const type = this.dataset.value
    selectAll('.showTypeBtn')
      .each(function() {
        select(this).classed('active', this.dataset.value === type)
      })
    territoryChart.setType(type)
  })
