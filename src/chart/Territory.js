import axios from 'axios'
import isMobile from 'ismobilejs'
import { max, mean } from 'd3-array'
import { select, event } from 'd3-selection'
import { scaleDiverging, scaleLinear } from 'd3-scale'
import { axisBottom } from 'd3-axis'
import {
  geoPath,
  geoMercator,
} from 'd3-geo'
import {
  interpolateOranges,
  interpolateGreens,
  interpolateReds,
} from 'd3-scale-chromatic'
import { format } from 'd3-format'
import transition from '../transition'
import dataset from '../Dataset'
import { serverDate } from '../format/date'
import BaseChart from './Base'

const int = format(',d')
const signInt = format('+,d')

export class Territory extends BaseChart {
  marginLeft = 0
  marginRight = 0
  marginBottom = 40
  marginTop = 0
  meanRatio = .5
  axesPadding = 30

  mapParts = 1
  VERSION = 'v1.1'

  view = 'full'
  type = 'confirmed'
  dataset = {
    type: 'FeatureCollection',
    features: [],
  }
  interpolations = {
    confirmed: interpolateOranges,
    recovered: interpolateGreens,
    deaths: interpolateReds,
  }
  _loaded = false

  constructor(selector, regionChart) {
    super(selector)
    this.updateSizes()
    this.updateClipPath()
    this.initGradients()
    this.initPath()
    this.updateZoom()

    this.regionChart = regionChart
    this.progress = this.container.select('.load-progress')

    dataset.getAll()
      .then(({ regions }) => {
        this.setStatData(regions)
        this.render()
        this.getRegions()
      })
  }

  updateClipPath() {
    this.clipPath
      .attr('x', this.marginLeft)
      .attr('width', this.innerWidth)
      .attr('y', this.marginTop)
      .attr('height', this.innerHeight)
  }

  updateZoom() {
    const extent = [
      [0, 0],
      [
        this.innerWidth,
        this.innerHeight,
      ],
    ]
    this.zoom
      .translateExtent(extent)
      .extent(extent)
  }

  resetZoom() {
    super.resetZoom()
    this.map.attr('transform', '')
  }

  afterLoad() {
    this._loaded = true
    this.initEuropeDataset()
    this.setType(this.type)
    setTimeout(() => {
      this.progress.remove()
    }, 1000)
    select('#territory-chart-box')
      .classed('hide-controls', false)
  }

  initGradients() {
    const interpolations = this.interpolations
    this.defs
      .selectAll('linearGradient')
      .data(['confirmed', 'recovered', 'deaths'])
      .enter()
      .append('linearGradient')
      .attr('id', (d) => `${d}Gradient`)
      .each(function(type) {
        select(this).selectAll('stop')
          .data([0, 25, 50, 75, 100])
          .enter()
          .append('stop')
          .attr('offset', (d) => `${d}%`)
          .attr('stop-color', (d) => interpolations[type](d / 100))
      })
  }

  getColor(value) {
    return this.interpolations[this.type](
      this.scale(value)
    )
  }

  getCofirmedColor(value) {
    return this.interpolations.confirmed(this.scaleDict.confirmed(value))
  }

  setStatData(byRegions) {
    this.byRegions = byRegions

    this.scaleDict = {}
    const confirmed = byRegions.map((region) => region.confirmed)
    this.scaleDict.confirmed = scaleDiverging()
      .domain([0, mean(confirmed), max(confirmed)])
      .range([0, this.meanRatio, 1])
    const recovered = byRegions.map((region) => region.recovered)
    this.scaleDict.recovered = scaleDiverging()
      .domain([0, mean(recovered), max(recovered)])
      .range([0, this.meanRatio, 1])
    const deaths = byRegions.map((region) => region.deaths)
    this.scaleDict.deaths = scaleDiverging()
      .domain([0, mean(deaths), max(deaths)])
      .range([0, this.meanRatio, 1])
  }

  getRegions(index = 0) {
    if (index >= this.mapParts) {
      this.progress.select('.progress-bar')
        .style('width', '100%')
      this.afterLoad()
      return
    }
    const width = this.mapParts !== 1
      ? index / this.mapParts * 100
      : 100
    this.progress.select('.progress-bar')
      .style('width', `${width}%`)
    let filename = `part-${index}.${this.VERSION}`
    if (isMobile(window.navigator).phone) {
      filename += '.slim'
    }
    axios.get(`/api/json/regions/${filename}.geojson`)
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

  initEuropeDataset() {
    this.europeDataset = {
      type: 'FeatureCollection',
      features: this.dataset.features
        .filter((item) => (
          [
            'Калининградская область',
            'Карелия',
            'Дагестан',
            'Свердловская область',
          ].includes(item.properties.name)
        ))
    }
  }

  initPath() {
    this.projection = geoMercator()
      .rotate([-100, -60, 5])
    this.geoPath = geoPath()
      .projection(this.projection)
  }

  updatePathBySize() {
    const dataset = this.view === 'full'
      ? this.dataset
      : this.europeDataset
    this.projection
      .fitSize(
        [this.innerWidth - 2 * this.axesPadding, this.innerHeight - 2 * this.axesPadding],
        dataset,
      )
  }

  setFullProjection() {
    this.view = 'full'
    this.projection
      .rotate([-100, -60, 5])
      .fitSize(
        [this.innerWidth - 2 * this.axesPadding, this.innerHeight - 2 * this.axesPadding],
        this.dataset,
      )
    this.resetZoom()
    this.resizeRegions()
  }

  setEuropeProjection() {
    this.view = 'europe'
    this.projection
      .rotate([-80, -60, 0])
      .fitSize(
        [this.innerWidth - 2 * this.axesPadding, this.innerHeight - 2 * this.axesPadding],
        this.europeDataset,
      )
    this.resetZoom()
    this.resizeRegions()
  }

  render() {
    this.renderAxes()

    this.map = this.svg.append('g')
      .attr('clip-path', `url(#clip-${this.id})`)
        .append('g')
        .attr('transform', `translate(${this.marginLeft + this.axesPadding}, ${this.marginTop + this.axesPadding})`)
          .append('g')
          .classed('map', true)
          .attr('stroke-width', .5);
  }

  renderAxes() {
    this.chromaticLeftAxisBox = this.svg.append('g')
    this.chromaticRightAxisBox = this.svg.append('g')
    this.chromaticColor = this.svg.append('rect')
      .attr('height', 10)
      .attr('x', this.marginLeft + this.axesPadding)
      .attr('y', this.height)
      .attr('fill', 'grey')
  }

  updateAxes() {
    if (!this._loaded) {
      return
    }
    const yPosition = this.height - this.marginBottom + 15
    const width = this.innerWidth - 2 * this.axesPadding
    const sizes = [
      this.marginLeft + this.axesPadding,
      this.marginLeft + this.axesPadding + width * this.meanRatio,
      this.width - this.marginRight - this.axesPadding - .5,
    ]
    const domain = this.scale.domain()
    const scaleLeft = scaleLinear()
      .range(sizes.slice(0, 2))
      .domain(domain.slice(0, 2))

    this.chromaticLeftAxisBox
      .attr('transform', `translate(0, ${yPosition})`)
      .transition(transition)
      .call(
        axisBottom()
          .scale(scaleLeft)
          .tickSizeOuter(0)
      )

    const scaleRight = scaleLinear()
      .range(sizes.slice(1))
      .domain(domain.slice(1))

    this.chromaticRightAxisBox
      .attr('transform', `translate(0, ${yPosition})`)
      .transition(transition)
      .call(
        axisBottom()
          .scale(scaleRight)
          .ticks(3)
          .tickSizeOuter(0)
      )

    this.chromaticColor
      .transition(transition)
      .attr('y', yPosition - 10)
      .attr('width', width)
      .attr('fill', `url(#${this.type}Gradient)`)
  }

  updateRegions() {
    this.updatePathBySize()
    this.map.selectAll('path.region')
      .data(this.dataset.features, (d) => d.properties.name)
      .join(
        (enter) => this._enterRegion(enter),
      )
      .attr('d', this.geoPath)
  }

  resizeRegions() {
    this.map.selectAll('path.region')
      .attr('d', this.geoPath)
  }

  _enterRegion(enter) {
    const me = this
    const tooltip = select('#tooltip')

    return enter.append('path')
      .classed('region', true)
      .attr('fill', '#d1d1d1')
      .on('mouseover', function({ properties, stat }) {
        let confirmed = '?'
        let recovered = '?'
        let deaths = '?'
        if (stat) {
          confirmed = me.getTooltipValue(stat, 'confirmed')
          recovered = me.getTooltipValue(stat, 'recovered')
          deaths = me.getTooltipValue(stat, 'deaths')
        }
        tooltip.html(`
          ${properties.name}
          <span class="cases">${confirmed}</span>&nbsp;
          <span class="recover">${recovered}</span>&nbsp;
          <span class="deaths">${deaths}</span>&nbsp;
        `)
      })
      .on('click', function({ stat }) {
        me.regionChart.setDataset(stat)
      })
  }

  getTooltipValue(stat, type) {
    let value = int(stat[type])
    const inc = stat[`${type}Inc`]
    if (inc) {
      value += ` (${signInt(inc)})`
    }
    return value
  }

  onResize() {
    super.onResize()
    this.updateClipPath()

    this.updatePathBySize()
    this.updateAxes()
    this.resizeRegions()
  }

  setType(type, silent = false) {
    this.type = type
    this.scale = this.scaleDict[type]
    this.updateAxes()
    if (!silent) {
      this.map.selectAll('path.region')
        .transition(transition)
        .attr('fill', ({ stat }) => this.getColor(stat[this.type]))
    }
  }

  updateConfirmedHistory(dateTime) {
    if (this.type !== 'confirmed') {
      this.setType('confirmed', true)
    }
    const date = serverDate(dateTime)
    const none = { confirmed: 0 }
    this.map.selectAll('path.region')
      .attr('fill', ({ stat }) => this.getColor(
        (stat.history.find((item) => item.date === date) || none).confirmed
      ))
  }

  onZoom() {
    this.map
      .attr('transform', event.transform)
      .attr('stroke-width', .5 / event.transform.k);
  }
}

export default Territory
