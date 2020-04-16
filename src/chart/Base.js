import { select } from 'd3-selection'
import { fullDate } from '../format/date'

export default class Base {
  marginLeft = 50
  marginRight = 30
  marginBottom = 30
  marginTop = 42
  svg = null

  constructor(selector) {
    this.container = select(selector)
    this.updateSizes()
    this.initSvg()

    select(window).on('resize', () => {
      this.onResize()
    })
  }

  updateSizes() {
    this.width = this.container.node().clientWidth
    this.height = this.container.node().clientHeight
    this.innerHeight = this.height - this.marginBottom - this.marginTop
    this.innerWidth = this.width - this.marginLeft - this.marginRight
  }

  initSvg() {
    this.svg = this.container
      .append('svg')
      .classed('chart', true)
      .style('height', this.height)
      .style('width', this.width)
    this.svg.append('clipPath')
      .attr('id', 'visible-area')
      .append('rect')
      .attr('x', this.marginLeft)
      .attr('y', 0)
      .attr('width', this.innerWidth + this.marginRight)
      .attr('height', this.height)
  }

  renderInfo(updateTime) {
    this.updateText = this.svg
      .append('text')
      .classed('updateTime', true)
      .attr('x', this.marginLeft + 10)
      .attr('y', this.marginTop + 20)
      .text(`Обновлено ${fullDate(updateTime)}`)
  }

  onResize() {
    this.updateSizes()
    this.svg
      .style('height', this.height)
      .style('width', this.width)
  }
}