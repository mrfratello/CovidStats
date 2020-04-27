import axios from 'axios'
import { max, mean } from 'd3-array'
import { select } from 'd3-selection'
import { scaleDiverging, scaleLinear } from 'd3-scale'
import { axisBottom } from 'd3-axis'
import {
  geoPath,
  geoConicEqualArea,
} from 'd3-geo'
import { interpolateOranges } from 'd3-scale-chromatic'
import dataset from '../Dataset'
import BaseChart from './Base'

export class Territory extends BaseChart {
  marginLeft = 30
  marginRight = 30
  marginBottom = 60
  marginTop = 30
  meanRatio = .6

  constructor(selector) {
    super(selector)
    this.updateSizes()

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
      .range([0, this.meanRatio, 1])
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

  updatePath() {
    const projection = geoConicEqualArea()
      .parallels([100, 50])
      .rotate([-100, 0])
      .fitSize([this.innerWidth, this.innerHeight], this.dataset)
    this.geoPath = geoPath()
      .projection(projection)
  }

  render() {
    this.updatePath()
    this.renderAxes()
    this.updateAxes()

    this.map = this.svg.append('g')
      .classed('map', true)
      .attr('transform', `translate(${this.marginLeft}, ${this.marginTop})`)

    this.map.selectAll('path.region')
      .data(this.dataset.features)
      .join(
        (enter) => this._enterRegion(enter),
      )
  }

  renderAxes() {
    this.chromaticLeftAxisBox = this.svg.append('g')
    this.chromaticRightAxisBox = this.svg.append('g')
    this.chromaticColor = this.container
      .append('div')
      .classed('chromatic-scale', true)
      .style('bottom', '-200px')
  }

  updateAxes() {
    const sizes = [
      this.marginLeft,
      this.marginLeft + this.innerWidth * this.meanRatio,
      this.width - this.marginRight - .5,
    ]
    const domain = this.scale.domain()
    const scaleLeft = scaleLinear()
      .range(sizes.slice(0, 2))
      .domain(domain.slice(0, 2))

    this.chromaticLeftAxisBox
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
      .call(
        axisBottom()
          .scale(scaleLeft)
          .tickSizeOuter(0)
      )

    const scaleRight = scaleLinear()
      .range(sizes.slice(1))
      .domain(domain.slice(1))

    this.chromaticRightAxisBox
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
      .call(
        axisBottom()
          .scale(scaleRight)
          .ticks(3)
          .tickSizeOuter(0)
      )

    this.chromaticColor
      .classed('chromatic-scale_color_orange', true)
      .style('bottom', `${this.marginBottom}px`)
      .style('left', `${this.marginLeft}px`)
      .style('right', `${this.marginRight}px`)
  }

  _enterRegion(enter) {
    const tooltip = select('#tooltip')

    return enter.append('path')
      .classed('region', true)
      .attr('d', this.geoPath)
      .attr('fill', (data) => interpolateOranges(this.scale(data.properties.confirmed)))
      .on('mouseover', function({ properties }) {
        tooltip.html(`
          ${properties.territoryName} &mdash;
          <span class="cases">${properties.confirmed}</span>&nbsp;
          <span class="recover">${properties.recovered}</span>&nbsp;
          <span class="deaths">${properties.deaths}</span>&nbsp;
        `)
      })
      .on('mouseout', () => {
        tooltip.html('&nbsp;')
      })
  }

  onResize() {
    super.onResize()

    this.updatePath()
    this.updateAxes()
    this.map.selectAll('path.region')
      .attr('d', this.geoPath)
  }
}

export default Territory
