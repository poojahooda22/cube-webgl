import { mat4, vec3 } from 'gl-matrix'
import { createPlane } from './plane'
import { createReflector } from './reflector'

export const planes = [
  {
    position: [1, 0, 0] as [number, number, number],
    normal: [1, 0, 0] as [number, number, number],
    rotation: -Math.PI * 0.5,
    axis: [0, 1, 0] as [number, number, number],
    uvRotation: Math.PI,
  },
  {
    position: [-1, 0, 0] as [number, number, number],
    normal: [-1, 0, 0] as [number, number, number],
    rotation: Math.PI * 0.5,
    axis: [0, 1, 0] as [number, number, number],
    uvRotation: Math.PI,
  },
  {
    position: [0, 1, 0] as [number, number, number],
    normal: [0, 1, 0] as [number, number, number],
    rotation: Math.PI * 0.5,
    axis: [1, 0, 0] as [number, number, number],
    uvRotation: 0,
  },
  {
    position: [0, -1, 0] as [number, number, number],
    normal: [0, -1, 0] as [number, number, number],
    rotation: -Math.PI * 0.5,
    axis: [1, 0, 0] as [number, number, number],
    uvRotation: 0,
  },
  {
    position: [0, 0, 1] as [number, number, number],
    normal: [0, 0, 1] as [number, number, number],
    rotation: Math.PI,
    axis: [0, 1, 0] as [number, number, number],
    uvRotation: Math.PI,
  },
  {
    position: [0, 0, -1] as [number, number, number],
    normal: [0, 0, -1] as [number, number, number],
    rotation: 0,
    axis: [0, 1, 0] as [number, number, number],
    uvRotation: Math.PI,
  },
]

const reflect = (a: vec3, b: vec3): vec3 => {
  const dot2 = new Array(3)

  dot2.fill(2 * vec3.dot(b, a))

  return vec3.sub([] as any, a, vec3.mul([] as any, dot2 as any, b))
}

export const createReflection = (regl: any, camera: any) => {
  const plane = createPlane(regl)
  const reflector = createReflector(regl)
  const renderTarget = regl.framebuffer()

  const setup = regl({
    context: {
      config: (
        _context: any,
        { cameraConfig: mainCameraConfig, rotationMatrix }: any,
        batchId: number
      ) => {
        const { position, normal, rotation, axis } = planes[batchId]

        const planeMatrix = mat4.translate(
          [] as any,
          rotationMatrix,
          position as any
        )
        const normalMatrix = mat4.translate(
          [] as any,
          rotationMatrix,
          normal as any
        )

        mat4.rotate(planeMatrix, planeMatrix, rotation, axis as any)

        const planeWorldPosition = mat4.getTranslation(
          [] as any,
          planeMatrix
        )
        const planeWorldNormal = mat4.getTranslation(
          [] as any,
          normalMatrix
        )
        const cameraWorldPosition = mainCameraConfig.eye

        let eye: any = [0, 0, 0]
        vec3.sub(eye, planeWorldPosition as any, cameraWorldPosition as any)
        eye = reflect(eye, planeWorldNormal as any)
        vec3.negate(eye, eye)
        vec3.add(eye, eye, planeWorldPosition as any)

        const lookAtPosition: any = [0, 0, -1]
        vec3.add(
          lookAtPosition,
          lookAtPosition,
          cameraWorldPosition as any
        )

        let target: any = [0, 0, 0]
        vec3.sub(target, planeWorldPosition as any, lookAtPosition)
        target = reflect(target, planeWorldNormal as any)
        vec3.negate(target, target)
        vec3.add(target, target, planeWorldPosition as any)

        let up: any = [0, 1, 0]
        up = reflect(up, planeWorldNormal as any)

        const cameraConfig = {
          eye,
          target,
          up,
        }

        return {
          cameraConfig,
          planeMatrix,
        }
      },
      uvRotation: (_context: any, _props: any, batchId: number) => {
        const { uvRotation } = planes[batchId]

        return uvRotation
      },
      faceFbo: (_context: any, { reflectionFbo }: any, batchId: number) => {
        return reflectionFbo.faces[batchId]
      },
    },
  })

  return ({
    reflectionFbo,
    cameraConfig,
    rotationMatrix,
    texture,
  }: any) => {
    const props = new Array(6)

    props.fill({
      reflectionFbo,
      cameraConfig,
      rotationMatrix,
    })

    setup(
      props,
      ({
        viewportWidth,
        viewportHeight,
        config,
        uvRotation,
        faceFbo,
      }: any) => {
        const textureMatrix = mat4.fromValues(
          0.5, 0, 0, 0,
          0, 0.5, 0, 0,
          0, 0, 0.5, 0,
          0.5, 0.5, 0.5, 1
        )

        renderTarget.resize(viewportWidth, viewportHeight)

        renderTarget.use(() => {
          regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
          })

          camera(
            config.cameraConfig,
            ({ projection, view, fov }: any) => {
              mat4.multiply(textureMatrix, textureMatrix, projection)
              mat4.mul(textureMatrix, textureMatrix, view)
              mat4.mul(textureMatrix, textureMatrix, config.planeMatrix)

              reflector({
                texture,
                cameraConfig,
                fov,
              })
            }
          )
        })

        faceFbo.use(() => {
          regl.clear({
            color: [0, 0, 0, 0],
            depth: 1,
          })

          plane({
            texture: renderTarget,
            textureMatrix,
            uvRotation,
          })
        })
      }
    )
  }
}
