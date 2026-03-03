import * as dat from 'dat.gui'
import queryString from 'query-string'

let gui: dat.GUI | null = null

const init = () => {
  if (!gui) {
    gui = new dat.GUI({ width: 300 })
  }
}

setTimeout(() => {
  const parsed = queryString.parse(location.search)
  const debugMode = parsed.debug === 'true'

  if (debugMode || import.meta.env.DEV) {
    init()
  }
})

export default {
  get: (callback: (gui: dat.GUI) => void) => {
    setTimeout(() => {
      if (gui) {
        callback(gui)
      }
    })
  },
}
