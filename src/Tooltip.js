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

  show({
    data,
    right,
    rect,
    type,
  }) {
    const position = [
      right ? 'right' : 'left',
      `${right ? rect.right : rect.left}px`,
    ]
    this.box.classed('active', true)
      .style(...position)
      .style(right ? 'left' : 'right', 'auto')

    const value = valueByType[type]

    this.box.append('div')
      .classed('cases value', true)
      .text(int(value('cases', data)))
    if (type !== ALL_SICKS_TYPE) {
      this.box.append('div')
        .classed('recover value', true)
        .text(int(value('recover', data)))
      this.box.append('div')
        .classed('deaths value', true)
        .text(int(value('deaths', data)))
    }
  }

  hide() {
    this.box
      // .classed('active', false)
      .selectAll('.value')
      .remove()
  }
}