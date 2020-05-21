import { max } from 'd3-array'
import { select, event } from 'd3-selection'
import { scaleBand, scaleLinear } from 'd3-scale'
import { axisRight, axisBottom } from 'd3-axis'
import { format } from 'd3-format'
import { shortDate, serverShortToDate } from '../format/date'
import BaseChart from './Base'
import transition, { casesColor } from '../transition'

const int = format(',d')

export default class RegionChart extends BaseChart {
  marginTop = 18
  maxTickWidth = 35
  history = []
  suffix = 'Inc'
  _didSet = false

  constructor(selector) {
    super(selector)
    this.updateSizes()
    this.zoom.on(`zoom.${this.id}`, null)
    this.initScales()
    this.box = select('#region-chart-box')
    this.title = this.box.select('.region-title')
    this.description = this.box.select('.region-description')

    this.renderAxes()
    this.renderBars()
  }

  getHistory() {
    return this.history
  }

  renderAxes() {
    this.countAxis = axisRight()
      .tickSizeOuter(0)
    this.countAxisBox = this.svg.append('g')
      .classed('count_axis', true)
      .attr('transform', `translate(${this.marginLeft + this.innerWidth}, 0)`)

    this.timeAxis = axisBottom()
      .tickSize(0)
      .tickPadding(10)
    this.timeAxisBox = this.svg.append('g')
      .classed('time_axis', true)
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
  }

  updateAxes() {
    this.countAxis.scale(this.countScale)

    this.countAxisBox
      .transition(transition)
      .attr('transform', `translate(${this.marginLeft + this.innerWidth}, 0)`)
      .call(this.countAxis)

    const tickTextOverBars = Math.ceil(this.maxTickWidth / this.timeScale.bandwidth())
    const dataLength = this.history.length
    const ticksTime = Math.floor(dataLength / tickTextOverBars)
    const divisorTime = Math.ceil(dataLength / ticksTime)

    this.timeAxis
      .scale(this.timeScale)
      .tickFormat((value, i) => (
        (dataLength - i - 1) % divisorTime
          ? ''
          : value
      ))
    this.timeAxisBox
      .transition(transition)
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
      .call(this.timeAxis)
  }

  renderBars() {
    this.overBars = this.svg.append('g')
      .attr('clip-path', `url(#clip-${this.id})`)

    this.confirmedBars = this.svg.append('g')
      .classed('cases', true)
      .attr('clip-path', `url(#clip-${this.id})`)
  }

  setDataset(data) {
    this.renderData(data)
    this.prepareDataset(data.history)
    this.calculateMax()
    this.updateDomains()
    setTimeout(() => {
      this.updateAxes()
      this.updateBars()
      if (!this._didSet) {
        this.box.classed('hide-controls', false)
        this.zoom.on(`zoom.${this.id}`, () => {
          this.onZoom()
        })
        this.resetZoom()
        this._didSet = true
      }
    }, 500)
  }

  scrollToChart() {
    window.scrollTo({
      top: this.box.node().offsetTop,
      behavior: 'smooth',
    })
  }

  renderData(data) {
    this.title.html(data.territoryName)
    this.description
      .classed('text-center', false)
      .html(`
        <span class="cases">${this.getTooltipValue(data, 'confirmed')}</span>&nbsp;
        <span class="recover">${this.getTooltipValue(data, 'recovered')}</span>&nbsp;
        <span class="deaths">${this.getTooltipValue(data, 'deaths')}</span>&nbsp;
      `)
  }

  getTooltipValue(data, type) {
    let value = int(data[type])
    const inc = data[`${type}Inc`]
    if (inc) {
      value += ` (+${int(inc)})`
    }
    return value
  }

  prepareDataset(history) {
    this.history = history
      .reduce((res, item) => {
        const prev = res[res.length - 1]
        const inc = item.confirmed - prev.confirmed
        res.push({
          date: shortDate(serverShortToDate(item.date)),
          confirmed: item.confirmed,
          confirmedInc: inc >= 0 ? inc : 0,
        })
        return res
      }, history.slice(0, 1))
      .slice(1)
  }

  calculateMax() {
    this.maxCount = max(this.history.map((item) => item[`confirmed${this.suffix}`]))
    this.maxInc = max(this.history, (d) => d.confirmedInc)
  }

  initScales() {
    this.countScale = scaleLinear()
      .range([this.height - this.marginBottom, this.marginTop])
    this.timeScale = scaleBand()
      .padding(0.1)
      .range([this.marginLeft, this.width - this.marginRight])
  }

  updateDomains() {
    this.countScale.domain([0, this.maxCount])
    this.timeScale.domain(this.history.map((item) => item.date))
  }
  updateRanges() {
    this.countScale
      .range([this.height - this.marginBottom, this.marginTop])
    this.timeScale
      .range([this.marginLeft, this.width - this.marginRight])
  }

  updateBars() {
    this.overBars.selectAll('.overBar')
      .data(this.history, ({ date }) => date)
      .join(
        (enter) => this._enterOvers(enter),
        (update) => update,
        (exit) => exit.remove(),
      )
      .call(this._updateBars.bind(this))
      .attr('y', () => this.countScale.range()[1])
      .attr('height', () => this.innerHeight)

    this.confirmedBars.selectAll('.caseBar')
      .data(this.history, ({ date }) => date)
      .join(
        (enter) => this._enterCases(enter),
        (update) => update,
        (exit) => exit
          .transition(transition)
          .attr('y', () => this.countScale.range()[0])
          .attr('height', 0)
          .remove()
      )
      .transition(transition)
      .call(this._updateBars.bind(this))
      .attr('y', (item) => this.countScale(item[`confirmed${this.suffix}`]))
      .attr('height', (item) => this.countScale(0) - this.countScale(item[`confirmed${this.suffix}`]))
      .style('fill', (item) => casesColor(item.confirmedInc / this.maxInc))
  }

  zoomBars() {
    this.overBars.selectAll('.overBar')
      .call(this._updateBars.bind(this))

    this.confirmedBars.selectAll('.caseBar')
      .call(this._updateBars.bind(this))
  }

  _enterOvers(enter) {
    const me = this

    return enter.append('rect')
      .classed('overBar', true)
      .on('mouseover', function(data, index) {
        const rect = select(this)
        const history = me.getHistory()
        me.tooltip.show({
          data: {
            cases: data[`confirmed${me.suffix}`],
            recover: null,
            deaths: null,
          },
          right: index > history.length / 2
            ? me.width - (+rect.attr('x') + +rect.attr('width')) + 'px'
            : 'auto',
          left: index <= history.length / 2
            ? rect.attr('x') + 'px'
            : 'auto',
        })
      })
      .on('mouseout', () => {
        me.tooltip.hide()
      })
  }

  _enterCases(enter) {
    return enter.append('rect')
      .classed('caseBar', true)
      .attr('x', ({ date }) => this.timeScale(date))
      .attr('y', () => this.countScale.range()[0])
      .attr('width', this.timeScale.bandwidth())
      .attr('height', 0)
  }

  _updateBars(update) {
    return update
      .attr('x', ({ date }) => this.timeScale(date))
      .attr('width', this.timeScale.bandwidth())
  }

  onResize() {
    super.onResize()

    this.updateRanges()
    this.updateAxes()
    this.updateBars()
  }

  setType(type) {
    this.suffix = type === 'full'
      ? ''
      : 'Inc'

    this.calculateMax()
    this.updateDomains()
    this.updateAxes()
    this.updateBars()
  }

  onZoom() {
    if (this._didSet) {
      const range = [this.marginLeft, this.width - this.marginRight]
        .map((d) => event.transform.applyX(d))
      this.timeScale.range(range)
      this.timeAxisBox.call(this.timeAxis)

      this.zoomBars()
    }
  }
}
