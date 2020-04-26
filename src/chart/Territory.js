import axios from 'axios'
import { max, mean } from 'd3-array'
import { select } from 'd3-selection'
import { scaleDiverging } from 'd3-scale'
import {
  geoPath,
  geoConicEqualArea,
} from 'd3-geo'
import { interpolateOranges } from 'd3-scale-chromatic'
import dataset from '../Dataset'
import BaseChart from './Base'

export class Territory extends BaseChart {

  constructor(selector) {
    super(selector)

    Promise.all([
      dataset.getAll(),
      axios.get('/api/json/new.regions.geojson')
        .then(({ data }) => data)
    ])
      .then(([{ regions }, geo]) => {
        this.merdeDataset(geo, regions)
        this.render()
      })
  }

  merdeDataset(geo, regions) {
    const confirmed = regions.map((region) => region.confirmed)
    this.scale = scaleDiverging()
      .domain([0, mean(confirmed), max(confirmed)])
      .range([0, .8, 1])
    this.dataset = {
      type: geo.type,
      features: geo.features.map((feature) => ({
        ...feature,
        properties: regions.find((region) => (
          region.territoryName === feature.properties.territoryName
        )),
      }))
    }
  }

  render() {
    const projection = geoConicEqualArea()
      .parallels([100, 50])
      .rotate([-100, 0])
      .fitSize([this.width, this.height], this.dataset)
    const path = geoPath()
      .projection(projection)

    const tooltip = select('#tooltip')

    this.svg.selectAll('path.region')
      .data(this.dataset.features)
      .enter()
      .append('path')
      .classed('region', true)
      .attr('d', path)
      .attr('fill', (data) => interpolateOranges(this.scale(data.properties.confirmed)))
      .on('mouseover', function({ properties }) {
        tooltip.html(`
          ${properties.territoryName} &mdash; ${properties.confirmed}
        `)
      })
      .on('mouseout', () => {
        tooltip.html('&nbsp;')
      })
  }
}

export default Territory
