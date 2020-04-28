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
  mapParts = 10
  dataset = {
    type: 'FeatureCollection',
    features: [],
  }

  constructor(selector) {
    super(selector)
    this.updateSizes()

    this.progress = this.container.select('.load-progress')

    dataset.getAll()
      .then(({ regions }) => {
        this.setStatData(regions)
        this.render()
        this.getRegions()
      })
  }

  setStatData(byRegions) {
    this.byRegions = byRegions

    const confirmed = byRegions.map((region) => region.confirmed)
    this.scale = scaleDiverging()
      .domain([0, mean(confirmed), max(confirmed)])
      .range([0, this.meanRatio, 1])
  }

  getRegions(index = 0) {
    if (index >= this.mapParts) {
      this.progress.select('.progress-bar')
        .style('width', '100%')
      setTimeout(() => {
        this.progress.remove()
      }, 1000)
      return
    }
    this.progress.select('.progress-bar')
      .style('width', `${index / this.mapParts * 100}%`)
    axios.get(`/api/json/regions/part-${index}.geojson`)
      .then(({ data }) => {
        this.merdeDataset(data)
        this.updateRegions()
        this.getRegions(index + 1)
      })
  }

  merdeDataset(geo) {
    geo.features.forEach((feature) => {
      this.dataset.features.push({
        type: feature.type,
        geometry: feature.geometry,
        properties: feature.properties,
        stat: this.byRegions
          .find((region) => (
            region.territoryName === feature.properties.name
            || region.territoryName === feature.properties.full_name
          ))
      })
    })
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
    this.renderAxes()
    this.updateAxes()

    this.map = this.svg.append('g')
      .classed('map', true)
      .attr('transform', `translate(${this.marginLeft}, ${this.marginTop})`)
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

  updateRegions() {
    this.updatePath()
    this.map.selectAll('path.region')
      .data(this.dataset.features, (d) => d.properties.name)
      .join(
        (enter) => this._enterRegion(enter),
        (update) => this._updateRegion(update),
      )
  }

  _enterRegion(enter) {
    const tooltip = select('#tooltip')

    return enter.append('path')
      .classed('region', true)
      .attr('d', this.geoPath)
      .attr('fill', ({ stat }) => interpolateOranges(this.scale(stat.confirmed)))
      .on('mouseover', function({ properties, stat }) {
        tooltip.html(`
          ${properties.name} &mdash;
          <span class="cases">${stat && stat.confirmed}</span>&nbsp;
          <span class="recover">${stat && stat.recovered}</span>&nbsp;
          <span class="deaths">${stat && stat.deaths}</span>&nbsp;
        `)
      })
      .on('mouseout', () => {
        tooltip.html('&nbsp;')
      })
  }

  _updateRegion(update) {
    return update.attr('d', this.geoPath)
  }

  onResize() {
    super.onResize()

    this.updatePath()
    this.updateAxes()
    this.updateRegions()
  }
}

export default Territory
