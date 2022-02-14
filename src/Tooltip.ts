import { format } from 'd3-format'
import type { Selection } from 'd3-selection'

const int = format(',d')

interface TooltipData {
  cases?: number | null
  recover?: number | null
  deaths?: number | null
}

interface ShowProps {
  data: TooltipData
  right?: string
  left?: string
}

export class Tooltip {
  protected box: Selection<HTMLDivElement, unknown, HTMLElement, unknown>

  constructor(
    container: Selection<HTMLElement, unknown, HTMLElement, unknown>,
  ) {
    this.box = container.append('div').classed('chart-tooltip', true)
  }

  public show({
    data: { cases = null, recover = null, deaths = null },
    right = 'auto',
    left = 'auto',
  }: ShowProps): void {
    this.box.classed('active', true).style('left', left).style('right', right)

    if (cases !== null) {
      this.box.append('div').classed('cases value', true).text(int(cases))
    }
    if (recover !== null) {
      this.box.append('div').classed('recover value', true).text(int(recover))
    }
    if (deaths !== null) {
      this.box.append('div').classed('deaths value', true).text(int(deaths))
    }
  }

  public hide(): void {
    this.box.selectAll('.value').remove()
  }
}

export default Tooltip
