import { max } from 'd3-array'
import { scaleBand, scaleLinear } from 'd3-scale'
import { axisLeft , axisBottom } from 'd3-axis'
import BaseChart from './Base'
import { shortDate } from '../format/date'
import dataset from '../Dataset'
import transition from '../transition'

export class PeriodOffset extends BaseChart {
  marginBottom = 80
  offsetDays = 13

  constructor(selector) {
    super(selector)
    this.updateSizes()

    dataset.getAll()
      .then(([data, updateTime]) => {
        this.render(data)
        this.renderInfo(updateTime)
      })
  }

  render(data) {
    this.pureDataset = data
    this.prepareDataset()
    this.updateScales()
    this.renderBars()
    this.renderAxes()
    this.updateBars()
  }

  prepareDataset() {
    this.dataset = this.pureDataset
      .slice(this.offsetDays)
      .map((item, i) => ({
        ...item,
        casesDay: this.pureDataset[i].casesDay,
        sumDay: item.recoverDay + item.deathsDay,
        dateOffset: this.pureDataset[i].date,
      }))
  }

  updateScales() {
    this.maxCount = max(
      this.dataset.flatMap(
        (item) => [item.casesDay, item.sumDay],
      ),
    )
    this.countScale = scaleLinear()
      .domain([0, this.maxCount])
      .range([this.height - this.marginBottom, this.marginTop])

    this.timeScale = scaleBand()
      .domain(this.dataset.map((item) => shortDate(item.date)))
      .range([this.marginLeft, this.width - this.marginRight])
      .padding(0.1)
    this.timeOffsetScale = this.timeScale
      .copy()
      .domain(this.dataset.map((item) => shortDate(item.dateOffset)))
  }

  renderAxes() {
    this.countAxis = axisLeft()
      .tickSizeOuter(0)
      .scale(this.countScale)

    this.svg.append('g')
      .classed('count_axis', true)
      .attr('transform', `translate(${this.marginLeft}, 0)`)
      .call(this.countAxis)

    this.timeAxis = axisBottom()
      .tickSize(0)
      .tickPadding(10)
      .scale(this.timeScale)
    this.timeAxesGroup = this.svg.append('g')
      .attr('clip-path', 'url(#visible-area)')
    this.timeAxisBox = this.timeAxesGroup
      .append('g')
      .classed('time_axis', true)
      .attr('transform', `translate(0, ${this.height - this.marginBottom})`)
      .call(this.timeAxis)

    this.timeOffsetAxis = axisBottom()
      .tickSize(0)
      .tickPadding(10)
      .scale(this.timeOffsetScale)
    this.axesBox = this.timeAxesGroup
      .append('g')
      .classed('time_axis', true)
      .attr('transform', `translate(0, ${this.height - this.marginBottom + 30})`)
      .call(this.timeOffsetAxis)
  }

  updateAxes() {
    this.scale = this.chart.timeAxes
      .scale()
      .copy()

    this.axes
      .scale(this.scale)
      .tickFormat(this.chart.timeAxes.tickFormat())

    this.xOffset =  -this.offsetDays * this.scale.bandwidth() / (1 - this.scale.padding())
    this.yOffset = this.chart.height - this.chart.marginBottom + 30

    this.axesBox
      .interrupt()
      .transition(transition)
      .attr('transform', `translate(0, ${this.yOffset})`)
      .transition(transition)
      .attr('transform', `translate(${this.xOffset }, ${this.yOffset})`)
      .call(this.axes)
  }

  renderBars() {
    const bandWidth = this.timeScale.bandwidth() / 2
    // const me = this
    this.overBars = this.svg
      .append('g')
        .selectAll('.overBar')
        .data(this.dataset, ({ date }) => date)
        .enter()
        .append('rect')
          .classed('overBar', true)
          .attr('x', ({ date }) => this.timeScale(shortDate(date)))
          .attr('y', () => this.countScale.range()[1])
          .attr('width', this.timeScale.bandwidth())
          .attr('height', () => this.innerHeight)
          // .on('mouseover', function(data, index) {
          //   const rect = select(this)
          //   me.tooltip.show({
          //     data,
          //     right: index > me.dataset.length / 2,
          //     type: me.type,
          //     rect: {
          //       left: +rect.attr('x'),
          //       right: me.width - (+rect.attr('x') + +rect.attr('width')),
          //     },
          //   })
          // })
          // .on('mouseout', () => {
          //   me.tooltip.hide()
          // })

    this.cases = this.svg.append('g')
      .classed('cases', true)
      .attr('clip-path', 'url(#visible-area)')
    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .enter()
      .append('rect')
        .classed('caseBar', true)
        .attr('x', ({ date }) => this.timeScale(shortDate(date)))
        .attr('y', () => this.countScale.range()[0])
        .attr('width', bandWidth)
        .attr('height', () => 0)

    this.recover = this.svg.append('g')
      .classed('recover', true)
      .attr('clip-path', 'url(#visible-area)')
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
      .attr('clip-path', 'url(#visible-area)')
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

    this.cases.selectAll('.caseBar')
      .data(this.dataset, ({ date }) => date)
      .transition(transition)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)) + bandWidth)
      .attr('width', bandWidth)
      .attr('y', (item) => this.countScale(item.casesDay))
      .attr('height', (item) => this.height - this.marginBottom - this.countScale(item.casesDay))
    this.recover.selectAll('.recoverBar')
      .transition(transition)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', bandWidth)
      .attr('y', (item) => this.countScale(item.recoverDay))
      .attr('height', (item) => this.countScale(0) - this.countScale(item.recoverDay))
    this.deaths.selectAll('.deathsBar')
      .transition(transition)
      .attr('x', ({ date }) => this.timeScale(shortDate(date)))
      .attr('width', bandWidth)
      .attr('y', (item) => this.countScale(item.sumDay))
      .attr('height', (item) => this.countScale(item.recoverDay) - this.countScale(item.sumDay))
  }
}

export default PeriodOffset
