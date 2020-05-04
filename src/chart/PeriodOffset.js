import { select, event } from 'd3-selection'
import { max } from 'd3-array'
import { scaleBand, scaleLinear } from 'd3-scale'
import { axisRight , axisBottom } from 'd3-axis'
import { shortDate } from '../format/date'
import dataset from '../Dataset'
import transition from '../transition'
import { DYNAMIC_TYPE } from '../constants'
import BaseChart from './Base'

export class PeriodOffset extends BaseChart {
  marginBottom = 80
  offsetDays = 13
  maxTickWidth = 35
  type = DYNAMIC_TYPE

  constructor(selector) {
    super(selector)
    this.updateSizes()
    this.updateZoom()
    this.initScales()

    dataset.getAll()
      .then(({ data, updateDate }) => {
        this.render(data)
        this.renderInfo(updateDate)
      })
  }

  render(data) {
    this.pureDataset = data
    this.prepareDataset()
    this.updateDomains()
    this.renderBars()
    this.renderAxes()
    this.updateBars()
    this.updateAxes()
  }

  prepareDataset() {
    this.dataset = this.pureDataset
      .slice(this.offsetDays)
      .map((item, i) => ({
        date: item.date,
        recoverDay: this.type === DYNAMIC_TYPE
          ? item.recoverDay
          : item.recover,
        deathsDay: this.type === DYNAMIC_TYPE
          ? item.deathsDay
          : item.deaths,
        casesDay: this.type === DYNAMIC_TYPE
          ? this.pureDataset[i].casesDay
          : this.pureDataset[i].cases,
        sumDay: this.type === DYNAMIC_TYPE
          ? item.recoverDay + item.deathsDay
          : item.recover + item.deaths,
        dateOffset: this.pureDataset[i].date,
      }))
  }

  initScales() {
    this.countScale = scaleLinear()
      .range([this.height - this.marginBottom, this.marginTop])

    this.timeScale = scaleBand()
      .range([this.marginLeft, this.width - this.marginRight])
      .padding(0.1)
    this.timeOffsetScale = this.timeScale.copy()
  }

  updateDomains() {
    this.maxCount = max(
      this.dataset.flatMap(
        (item) => [item.casesDay, item.sumDay],
      ),
    )
    this.countScale.domain([0, this.maxCount])
    this.timeScale
      .domain(this.dataset.map((item) => shortDate(item.date)))
    this.timeOffsetScale
      .domain(this.dataset.map((item) => shortDate(item.dateOffset)))
  }

  updateRanges() {
    this.countScale
      .range([this.height - this.marginBottom, this.marginTop])
    this.timeScale
      .range([this.marginLeft, this.width - this.marginRight])
    this.timeOffsetScale
      .range([this.marginLeft, this.width - this.marginRight])
  }

  renderAxes() {
    this.countAxis = axisRight()
      .tickSizeOuter(0)
    this.countAxisBox = this.svg.append('g')
      .classed('count_axis', true)

    this.timeAxesGroup = this.svg.append('g')

    this.timeAxis = axisBottom()
      .tickSize(0)
      .tickPadding(10)
    this.timeAxisBox = this.timeAxesGroup
      .append('g')
      .classed('time_axis', true)

    this.timeOffsetAxis = axisBottom()
      .tickSize(0)
      .tickPadding(10)
    this.timeOffsetAxisBox = this.timeAxesGroup
      .append('g')
      .classed('time_axis', true)
  }

  updateAxes() {
    this.countAxis.scale(this.countScale)

    this.countAxisBox
      .transition(transition)
      .attr('transform', `translate(${this.marginLeft + this.innerWidth}, 0)`)
      .call(this.countAxis)

    const tickTextOverBars = Math.ceil(this.maxTickWidth / this.timeScale.bandwidth())
    const dataLength = this.dataset.length
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

    this.timeOffsetAxis
      .scale(this.timeOffsetScale)
      .tickFormat((value, i) => (
        (dataLength - i + 1) % divisorTime
          ? ''
          : value
      ))
    this.timeOffsetAxisBox
      .transition(transition)
      .attr('transform', `translate(0, ${this.height - this.marginBottom + 30})`)
      .call(this.timeOffsetAxis)
  }

  renderBars() {
    const bandWidth = this.timeScale.bandwidth() / 2

    this.overBars = this.svg.append('g')
      .attr('clip-path', `url(#clip-${this.id})`)
    this.overBars.selectAll('.overBar')
      .data(this.dataset, ({ date }) => date)
      .join(
        (enter) => this._enterOvers(enter),
      )

    this.cases = this.svg.append('g')
      .classed('cases', true)
      .attr('clip-path', `url(#clip-${this.id})`)
    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ dateOffset }) => dateOffset)
      .join(
        (enter) => this._enterCases(enter)
      )

    this.recover = this.svg.append('g')
      .classed('recover', true)
      .attr('clip-path', `url(#clip-${this.id})`)
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('recoverBar', true)
        .attr('x', ({ date }) => this.timeScale(shortDate(date)) + bandWidth)
        .attr('y', () => this.countScale.range()[0])
        .attr('width', bandWidth)
        .attr('height', () => 0)

    this.deaths = this.svg.append('g')
      .classed('deaths', true)
      .attr('clip-path', `url(#clip-${this.id})`)
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('deathsBar', true)
        .attr('x', ({ date }) => this.timeScale(shortDate(date)) + bandWidth)
        .attr('y', () => this.countScale.range()[0])
        .attr('width', bandWidth)
        .attr('height', () => 0)
  }

  updateBars() {
    const bandWidth = this.timeScale.bandwidth() / 2

    this.overBars.selectAll('.overBar')
      .data(this.dataset, ({ date }) => date)
      .join(
        (enter) => this._enterOvers(enter),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', this.timeScale.bandwidth())
      .attr('y', () => this.countScale.range()[1])
      .attr('height', () => this.innerHeight)

    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ dateOffset }) => dateOffset)
      .join(
        (enter) => this._enterCases(enter),
        (update) => update,
        (exit) => exit
          .transition(transition)
          .attr('x', ({ date }) => this.timeScale(shortDate(date)) + 100)
          .remove()
      )
      .transition(transition)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) + bandWidth)
      .attr('width', bandWidth)
      .attr('y', (item) => this.countScale(item.casesDay))
      .attr('height', (item) => this.countScale(0) - this.countScale(item.casesDay))
    this.recover.selectAll('.recoverBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', bandWidth)
      .attr('y', (item) => this.countScale(item.recoverDay))
      .attr('height', (item) => this.countScale(0) - this.countScale(item.recoverDay))
    this.deaths.selectAll('.deathsBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', bandWidth)
      .attr('y', (item) => this.countScale(item.sumDay))
      .attr('height', (item) => this.countScale(item.recoverDay) - this.countScale(item.sumDay))
  }

  zoomBars() {
    const bandWidth = this.timeScale.bandwidth() / 2

    this.overBars.selectAll('.overBar')
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', this.timeScale.bandwidth())
    this.cases.selectAll('.caseBar')
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) + bandWidth)
      .attr('width', bandWidth)
    this.recover.selectAll('.recoverBar')
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', bandWidth)
    this.deaths.selectAll('.deathsBar')
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', bandWidth)
  }

  _enterOvers(enter) {
    const me = this

    return enter.append('rect')
      .classed('overBar', true)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('y', () => this.countScale.range()[1])
      .attr('width', this.timeScale.bandwidth())
      .attr('height', () => this.innerHeight)
      .on('mouseover', function(data, index) {
        const rect = select(this)
        me.tooltip.show({
          data: {
            cases: data.casesDay,
            recover: data.recoverDay,
            deaths: data.deathsDay,
          },
          right: index > me.dataset.length / 2
            ? me.width - (+rect.attr('x') + +rect.attr('width')) + 'px'
            : 'auto',
          left: index <= me.dataset.length / 2
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
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('y', this.countScale.range()[0])
      .attr('width', this.timeScale.bandwidth() / 2)
      .attr('height', 0)
  }

  onResize() {
    super.onResize()

    this.updateRanges()
    this.updateAxes()
    this.updateBars()
  }

  onUpdateOptions() {
    this.prepareDataset()
    this.updateDomains()
    this.updateAxes()
    this.updateBars()
  }

  onUpdateType(type) {
    this.type = type
    this.onUpdateOptions()
  }

  onUpdateOffset(offset) {
    this.offsetDays = offset
    this.onUpdateOptions()
  }


  onZoom() {
    const range = [this.marginLeft, this.width - this.marginRight]
      .map((d) => event.transform.applyX(d))
    this.timeScale.range(range)
    this.timeOffsetScale.range(range)
    this.timeAxisBox.call(this.timeAxis)
    this.timeOffsetAxisBox.call(this.timeOffsetAxis)

    this.zoomBars()
  }
}

export default PeriodOffset
