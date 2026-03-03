import createREGL from 'regl'

export const createRenderer = (container: HTMLElement) => {
  const regl = createREGL({
    container,
    attributes: {
      antialias: true,
      alpha: true,
    },
  })

  let tick: { cancel: () => void } | null = null

  const play = (action: any) => {
    if (!tick) {
      tick = regl.frame(action)
    }
  }

  const stop = () => {
    if (tick) {
      tick.cancel()
      tick = null
    }
  }

  return { regl, play, stop }
}
