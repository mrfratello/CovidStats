import { timeDays } from 'd3-time'
import Scrubber from '../ui/scrubber'
import { DURATION } from '../transition'
import { shortDate } from '../format/date'
import dataset from '../Dataset'

const START_DAY = new Date(2020, 3, 15)

export default class MapTimelapse {
  constructor(node, chart, controls) {
    this.node = node
    this.chart = chart
    this.controls = controls

    dataset.getAll()
      .then(({ updateDate }) => {
        this.days = timeDays(START_DAY, updateDate)
        this.initScrubber()
      })
  }

  initScrubber() {
    this.scrubber = Scrubber(this.node, this.days, {
      delay: DURATION / 2,
      format: shortDate,
      loop: false,
    })

    this.controls.on('click.scrubber', () => {
      this.scrubber.stop()
    })

    this.scrubber.addEventListener('input', (e) => {
      this.controls.classed('active', false)
      this.chart.updateConfirmedHistory(
        this.scrubber.value,
      )
    })
  }
}