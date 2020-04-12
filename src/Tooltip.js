import { format } from 'd3-format'
import {
  ALL_SICKS_TYPE,
  valueByType,
} from './constants'

const int = format(',d')

export default class Tooltip {
  constructor(container) {
    this.box = container.append('div')
      .classed('chart-tooltip', true)
  }

  setDataset(data) {
    this.dataset = data
  }

  show({
    data,
    right,
    rect,
    type,
    index,
    periodOffset,
  }) {
    const position = [
      right ? 'right' : 'left',
      `${right ? rect.right : rect.left}px`,
    ]
    this.box.classed('active', true)
      .style(...position)
      .style(right ? 'left' : 'right', 'auto')

    const value = valueByType[type]

    const cases = int(value('cases', data))
    let recover = int(value('recover', data))
    let deaths = int(value('deaths', data))

    if (periodOffset !== null) {
      const offsetIndex = index + periodOffset.offsetDays
      if (offsetIndex >= this.dataset.length) {
        recover = '—'
        deaths = '—'
      } else {
        const item = this.dataset[offsetIndex]
        recover = int(value('recover', item))
        deaths = int(value('deaths', item))
      }
    }

    this.box.append('div')
      .classed('cases value', true)
      .text(cases)
    if (type !== ALL_SICKS_TYPE) {
      this.box.append('div')
        .classed('recover value', true)
        .text(recover)
      this.box.append('div')
        .classed('deaths value', true)
        .text(deaths)
    }
  }

  hide() {
    this.box
      .selectAll('.value')
      .remove()
  }
}
