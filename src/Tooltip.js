import { format } from 'd3-format'

const int = format(',d')

export default class Tooltip {
  constructor(container) {
    this.box = container.append('div').classed('chart-tooltip', true)
  }

  setDataset(data) {
    this.dataset = data
  }

  show({
    data: { cases = null, recover = null, deaths = null },
    right = 'auto',
    left = 'auto',
  }) {
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

  hide() {
    this.box.selectAll('.value').remove()
  }
}
