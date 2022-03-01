import { format } from 'd3-format'
import { path } from 'd3-path'
import { type Selection } from 'd3-selection'
import { type TooltipValue } from './types'

interface ShowProps {
  data: TooltipValue[]
  offset: number
  isRight?: boolean
}

const int = format(',d')

function getRect(width: number, height: number, radius = 6) {
  const p = path()
  p.moveTo(0, 0)
  p.lineTo(width - radius, 0)
  p.arc(width - radius, 0 + radius, radius, (Math.PI * 3) / 2, 0)
  p.lineTo(width, height - radius)
  p.arc(width - radius, height - radius, radius, 0, Math.PI / 2)
  p.lineTo(0, height)
  return p.toString()
}

function getDataKey(data: TooltipValue): string {
  return data.className
}

export class Tooltip {
  protected group: Selection<SVGGElement, unknown, HTMLElement, unknown>

  protected text: Selection<SVGTextElement, unknown, HTMLElement, unknown>

  protected rectPath: Selection<SVGPathElement, unknown, HTMLElement, unknown>

  static isCases(data: TooltipValue): boolean {
    return data.className === 'cases'
  }

  static isRecover(data: TooltipValue): boolean {
    return data.className === 'recover'
  }

  static isDeaths(data: TooltipValue): boolean {
    return data.className === 'deaths'
  }

  constructor(
    container: Selection<HTMLElement, unknown, HTMLElement, unknown>,
  ) {
    this.group = container
      .select('svg')
      .append('g')
      .classed('chart-tooltip', true)

    this.text = this.group.append('text')
    this.rectPath = this.group.append('path').classed('rect', true)
  }

  public show({ data, offset, isRight = false }: ShowProps): void {
    const sortedData = data.slice().sort((a, b) => b.value - a.value)

    this.group
      .classed('active', true)
      .attr('transform', `translate(${offset}, 0)`)

    this.text
      .selectAll<SVGTSpanElement, TooltipValue>('tspan')
      .data(sortedData, getDataKey)
      .join(
        (enter) =>
          enter
            .append('tspan')
            .attr('x', 0)
            .attr('dy', 13)
            .attr('y', (_, i) => i * 13),
        (update) =>
          update
            .interrupt('fast')
            .transition('fast')
            .attr('y', (_, i) => i * 13),
      )
      .classed('cases', Tooltip.isCases)
      .classed('recover', Tooltip.isRecover)
      .classed('deaths', Tooltip.isDeaths)
      .attr('text-anchor', isRight ? 'start' : 'end')
      .attr('dx', isRight ? 6 : -6)
      .text((d) => int(d.value))

    const node = this.text.node()
    if (node) {
      const { height, width } = node.getBBox()

      this.rectPath
        .attr('transform', isRight ? '' : 'scale(-1 1)')
        .attr('d', getRect(width + 16, height + 4))
    }
  }

  public hide(): void {
    this.group.classed('active', false)
    this.text
      .selectAll<SVGTSpanElement, TooltipValue>('tspan')
      .data<TooltipValue>([], getDataKey)
      .join('tspan')
  }
}
