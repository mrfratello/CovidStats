import { select } from 'd3-selection'

export default class Base {
  marginLeft = 50
  marginRight = 30
  marginBottom = 60
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

  onResize() {
    this.updateSizes()
    this.svg
      .style('height', this.height)
      .style('width', this.width)
  }
}