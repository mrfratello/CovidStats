import { formatDefaultLocale } from 'd3-format'
import numberLocale from 'd3-format/locale/ru-RU'
import { timeFormatDefaultLocale } from 'd3-time-format'
import timeLocale from 'd3-time-format/locale/ru-RU'

formatDefaultLocale(numberLocale)
timeFormatDefaultLocale({
  ...timeLocale,
  shortMonths: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
})
