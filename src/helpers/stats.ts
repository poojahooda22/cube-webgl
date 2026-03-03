import Stats from 'stats.js'

let stats: Stats | null = null

const init = () => {
  stats = new Stats()

  stats.showPanel(0)

  document.body.appendChild(stats.dom)
}

if (import.meta.env.DEV) {
  init()
}

export default {
  begin: () => {
    if (stats) {
      stats.begin()
    }
  },
  end: () => {
    if (stats) {
      stats.end()
    }
  },
}
