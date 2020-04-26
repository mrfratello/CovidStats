import axios from 'axios'
import {
  geoPath,
  geoConicEqualArea,
} from 'd3-geo'
import { interpolateOranges } from 'd3-scale-chromatic'
import BaseChart from './Base'

export class Territory extends BaseChart {

  constructor(selector) {
    super(selector)
    axios.get('/api/json/regions.geojson')
      .then((responce) => {
        this.geo = responce.data
        this.render()
      })
  }

  render() {
    const projection = geoConicEqualArea()
      .parallels([100, 50])
      .rotate([-100, 0])
      .fitSize([this.width, this.height], this.geo)
    const path = geoPath()
      .projection(projection)

    this.svg.selectAll('path.region')
      .data(this.geo.features)
      .enter()
      .append('path')
      .classed('region', true)
      .attr('d', path)
      .attr('fill', (data, i) => interpolateOranges(i > 50 ? .9 : 0))
  }
}

export default Territory
