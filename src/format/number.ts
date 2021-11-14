import { format } from 'd3-format'

export const int = format(',d')
export const united = format('~s')
export const humanInt = (n: number): string =>
  united(n).replace(/[a-z]{1}$/i, (match) => {
    switch (match) {
      case 'k':
        return ' тыс'
      case 'M':
        return ' млн'
      default:
        return match
    }
  })
