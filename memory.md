# Apple Fifth Avenue Cube — Implementation Memory

Complete documentation of the WebGL cube project: architecture, every file, every shader, every uniform, every asset, and every runtime behavior.

---

## A) Executive Overview

This project renders a glass-like rotating cube inspired by the Apple Fifth Avenue Store installation. It uses **REGL** (a functional WebGL abstraction) instead of Three.js, with **gl-matrix** for matrix math, wrapped in a **React + TypeScript + Vite** application.

### End-to-End Rendering Pipeline

```
App Init
  └─ Scene.tsx useEffect()
       ├─ createRenderer() → REGL context on <div.content>
       ├─ createCamera() → perspective projection + lookAt view REGL scope
       ├─ createCube() → REGL draw command (3 modes: displacement/mask/final)
       ├─ createContent() → REGL draw command (5 face passes with gradients)
       ├─ createReflection() → 6-face cubemap reflection system
       ├─ 4 FBOs: displacementFbo, maskFbo, contentFbo, reflectionFbo (cubemap 1024²)
       ├─ Texture loader → logo.png async loaded into REGL textures
       └─ regl.frame() animation loop:
            │
            ├─ PASS 1: Displacement (cube → displacementFbo, type=1)
            │   Output: angle from face center + border stroke displacement in RG channels
            │
            ├─ PASS 2: Mask (cube → maskFbo, type=2)
            │   Output: color-coded face IDs (RGB encodes mask 1-5)
            │
            ├─ PASS 3: Content (content → contentFbo)
            │   Reads: displacementFbo + maskFbo
            │   Renders 5 sub-passes (one per face mask)
            │   Each: texture + procedural gradient, UV displaced by pass 1 data
            │
            ├─ PASS 4: Reflection (6 iterations → reflectionFbo cubemap)
            │   For each cube face: reflect camera, render scene, project to cubemap face
            │
            └─ PASS 5: Final composite (cube to screen, type=3)
                 ├─ Front faces (cull=FRONT): cubemap reflection + rainbow border stroke
                 └─ Back faces (cull=BACK): contentFbo texture + rainbow border stroke
```

---

## B) Repository Map

### Directory Tree

```
cube-webgl/
├── index.html                          HTML entry point
├── package.json                        Dependencies & scripts
├── vite.config.ts                      Vite + React + GLSL plugins
├── tsconfig.json                       TypeScript project references
├── tsconfig.app.json                   App TS config (ES2022, strict, react-jsx)
├── tsconfig.node.json                  Node TS config (build tools)
├── eslint.config.js                    ESLint flat config
├── memory.md                           THIS FILE
├── public/
│   └── vite.svg
├── src/
│   ├── main.tsx                        React DOM root mount
│   ├── App.tsx                         Renders <Scene />
│   ├── index.css                       Global styles + .content layout
│   ├── vite-env.d.ts                   Module declarations (.glsl, .png, query-string)
│   ├── renderer.ts                     REGL context factory
│   ├── camera.ts                       Perspective camera REGL scope
│   ├── assets/
│   │   ├── logo.png                    Apple logo texture (36KB)
│   │   ├── text-1.png                  Text texture for top face (20KB)
│   │   └── text-2.png                  Text texture for bottom face (20KB)
│   ├── glsl/
│   │   ├── borders.glsl                Smoothstep edge stroke function
│   │   ├── gradients.glsl              3 procedural gradient generators
│   │   └── radial-rainbow.glsl         Animated radial rainbow color wheel
│   ├── helpers/
│   │   ├── Texture.ts                  Async image → REGL texture loader
│   │   ├── gui.ts                      dat.GUI lazy initializer (debug mode)
│   │   └── stats.ts                    stats.js FPS panel (dev mode)
│   └── components/
│       ├── Scene.tsx                   Main component: REGL lifecycle + render loop
│       ├── cube/
│       │   ├── index.ts                Cube REGL draw command + exports (Types, Faces, Masks)
│       │   ├── config.ts               24-vertex indexed cube geometry data
│       │   ├── shader.vert.glsl        Cube vertex shader
│       │   └── shader.frag.glsl        Cube fragment shader (3 modes)
│       ├── content/
│       │   ├── index.ts                Content REGL draw command (setup + draw)
│       │   ├── config.ts               Fullscreen quad geometry
│       │   ├── shader.vert.glsl        Content vertex shader
│       │   └── shader.frag.glsl        Content fragment shader (displacement + gradients)
│       └── reflection/
│           ├── index.ts                Reflection orchestrator (6-face cubemap)
│           ├── plane/
│           │   ├── index.ts            Reflection plane draw command
│           │   ├── config.ts           Plane triangle geometry (6 vertices)
│           │   ├── shader.vert.glsl    Plane vertex shader (texture matrix)
│           │   └── shader.frag.glsl    Plane fragment shader (texture2DProj)
│           └── reflector/
│               ├── index.ts            Reflector draw command (scene-sized quad)
│               ├── config.ts           Reflector quad geometry
│               ├── shader.vert.glsl    Reflector vertex shader (depth calc)
│               └── shader.frag.glsl    Reflector fragment shader (depth fade)
```

### File Purpose Table

| File | Purpose | Key Exports | Dependencies |
|------|---------|-------------|--------------|
| `main.tsx` | React DOM mount | — | react-dom, App |
| `App.tsx` | Root component | App | Scene |
| `Scene.tsx` | REGL lifecycle, render loop, FBOs, textures | Scene | renderer, camera, cube, content, reflection, Texture, gui, stats, gl-matrix |
| `renderer.ts` | Creates REGL context + play/stop | createRenderer | regl |
| `camera.ts` | Projection + view matrices | createCamera | gl-matrix, gui |
| `cube/index.ts` | Cube draw command (3 modes) | createCube, Types, Faces, Masks | gl-matrix, gui, config, shaders |
| `cube/config.ts` | Cube geometry data | positions, centers, uv, elements, colors | — |
| `content/index.ts` | Content draw + setup commands | createContent, Types | gl-matrix, gui, config, shaders |
| `content/config.ts` | Fullscreen quad geometry | positions, uv, elements | — |
| `reflection/index.ts` | 6-face reflection orchestrator | createReflection, planes | gl-matrix, plane, reflector |
| `reflection/plane/index.ts` | Plane draw command | createPlane | gl-matrix, config, shaders |
| `reflection/reflector/index.ts` | Reflector draw command | createReflector | gl-matrix, gui, config, shaders |
| `helpers/Texture.ts` | Image→texture loader | default export (factory) | — |
| `helpers/gui.ts` | dat.GUI lazy init | default export (.get()) | dat.gui, query-string |
| `helpers/stats.ts` | FPS panel | default export (.begin/.end) | stats.js |

---

## C) Build + Runtime

### How to Run

```bash
npm install          # Install all dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # TypeScript check + production build → dist/
npm run preview      # Preview production build locally
```

### Tooling

| Tool | Version | Role |
|------|---------|------|
| Vite | 7.3.1 | Dev server, HMR, production bundler |
| React | 19.2.0 | UI framework (thin wrapper for REGL) |
| TypeScript | 5.9.3 | Type checking (strict mode) |
| vite-plugin-glsl | 1.3.1 | Imports .glsl files as strings, resolves `#include` directives |
| @vitejs/plugin-react | 5.1.1 | React Fast Refresh + JSX transform |

### How Shaders Are Handled

- Shader files (`.glsl`, `.vert.glsl`, `.frag.glsl`) are imported as strings via `vite-plugin-glsl`
- The plugin resolves `#include "relative/path.glsl"` directives at build time, inlining the referenced file
- Adapted from source's `#pragma glslify: fn = require(path)` → `#include "path"`
- Constants shared between utility files and consumer shaders are defined in the consumer to avoid redefinition errors (e.g., `PI2`)

### How Assets Are Handled

- PNG textures imported via Vite's static asset handling: `import logoUrl from '../assets/logo.png'`
- Vite resolves these to hashed URLs in production builds
- The Texture helper loads these URLs via `new Image()` → `image.onload` → `regl.texture({ data, flipY, min: 'mipmap' })`

### Environment Variables

- `import.meta.env.DEV` — true in development, controls dat.GUI and stats.js initialization
- `?debug=true` URL param — enables dat.GUI in production builds

---

## D) Rendering Architecture

### Step-by-Step Pipeline

#### 1. Initialization (Scene.tsx useEffect)

```
createRenderer(container) → { regl, play, stop }
createCamera(regl)        → camera scope command
createCube(regl)          → cube draw command
createContent(regl)       → content function
createReflection(regl, camera) → reflection function

regl.framebuffer()        → displacementFbo (resized each frame)
regl.framebuffer()        → maskFbo (resized each frame)
regl.framebuffer()        → contentFbo (resized each frame)
regl.framebufferCube(1024) → reflectionFbo (6 faces, 1024x1024)

Texture(regl, logoUrl)    → 5 texture instances (async load)
```

#### 2. Each Frame (animate callback via regl.frame)

**Rotation Matrix Calculation:**
```
factor = tick * velocity (0.009)
rotationMatrix = identity
  → rotate by CONFIG.rotation (4.8) around [rotateX, rotateY, rotateZ]
  → rotate by factor around [cos(factor), sin(factor), 0.5]
```

**Pass 1 — Displacement** (inside camera scope):
- Cube rendered with `typeId=1`, `cullFace='back'` → `displacementFbo`
- Fragment shader outputs: R = angle from face center, G = border displacement magnitude

**Pass 2 — Mask** (inside camera scope):
- Cube rendered with `typeId=2`, `cullFace='back'` → `maskFbo`
- Fragment shader outputs: face color (RGB encodes mask ID 1-5)

**Pass 3 — Content** (inside camera scope → contentFbo.use):
- Content draws 5 sub-passes (one per texture/mask combo)
- Each reads `displacementFbo` for UV displacement and `maskFbo` for face selection
- Applies procedural gradient (RAINBOW/BLUE/RED) blended with texture

**Pass 4 — Reflection** (outside camera scope):
- For each of 6 cube faces:
  - Compute reflected camera position across the face plane
  - Render scene from reflected viewpoint into temp FBO
  - Project temp FBO onto cubemap face via texture matrix

**Pass 5 — Final Composite** (inside camera scope):
- Back face (cull='front'): `typeId=3`, uses `reflectionFbo` cubemap
  - Fragment: cubemap lookup for reflection + rainbow border stroke
- Front face (cull='back'): `typeId=3`, uses `contentFbo`
  - Fragment: content texture + rainbow border stroke

### Scene Graph / Node Connections

There is no traditional scene graph. REGL uses a flat command-based architecture:

```
camera (scope — sets u_projection, u_view, u_resolution)
  └─ cube (draw command — batched, sets world matrix from CONFIG + rotationMatrix)
       ├─ Attributes: a_position, a_center, a_uv, a_color (from config.ts)
       ├─ Uniforms: u_world, u_face, u_typeId, u_texture, u_reflection, u_tick, ...
       └─ State: cull face, depth test, alpha blend, target FBO

content (setup scope + draw command)
  ├─ setup: sets u_world, u_mask, u_displacement, u_tick
  └─ draw: renders 5 times with different texture/typeId/maskId

reflection (setup scope + 6-batch draw)
  ├─ For each face: computes reflected camera, renders reflector + plane
  ├─ reflector: fullscreen quad showing contentFbo, scaled to camera frustum
  └─ plane: projects renderTarget to cubemap face with textureMatrix
```

### Camera

| Property | Value |
|----------|-------|
| Type | Perspective |
| FOV | 45 degrees (configurable via GUI) |
| Near | 0.01 |
| Far | 1000 |
| Position | (0, 0, 5.7) — configurable |
| Target | (0, 0, 0) |
| Up | (0, 1, 0) |

Camera is implemented as a REGL scope command that computes `projection` and `view` matrices per frame and sets them as uniforms (`u_projection`, `u_view`) plus `u_resolution`.

### Lighting & Environment

There is **no explicit lighting**. Visual effects come from:
- Procedural gradients applied to face content
- Cubemap reflections showing content from other faces
- Animated rainbow border strokes
- Depth-based opacity for reflections

### Materials → Shader Mapping

| Visual Element | Shader | Mode |
|----------------|--------|------|
| Displacement data | cube/shader.frag.glsl | `u_typeId=1` (type1) |
| Face mask | cube/shader.frag.glsl | `u_typeId=2` (type2) |
| Final front face | cube/shader.frag.glsl | `u_typeId=3`, `u_face=-1` (cubemap reflection) |
| Final back face | cube/shader.frag.glsl | `u_typeId=3`, `u_face=1` (content texture) |
| Face content | content/shader.frag.glsl | displacement + gradient + mask |
| Reflection plane | plane/shader.frag.glsl | texture2DProj |
| Reflector quad | reflector/shader.frag.glsl | depth-faded texture |

---

## E) Shaders (File-by-File)

### E.1) `src/glsl/borders.glsl`

**Used by:** cube/shader.frag.glsl (via `#include`)

**Function:** `float borders(vec2 uv, float strokeWidth)`

Creates an edge stroke at UV boundaries using smoothstep. Returns 1.0 at edges (within `strokeWidth` of UV borders), 0.0 in center. Used for both displacement computation and rainbow border rendering.

**Inputs:** UV coordinates, stroke width
**Outputs:** float [0,1] — edge intensity

---

### E.2) `src/glsl/gradients.glsl`

**Used by:** content/shader.frag.glsl (via `#include`)

**Defines:**
- `const float PI` — 3.141592653589793
- `mat2 scale(vec2)` — 2D scale matrix
- `mat2 rotate2d(float)` — 2D rotation matrix
- `vec3 gradient1(vec2 st, float tick)` — Radial rainbow: orange→red→purple→blue, uses atan for radial mapping, scale+rotate transforms
- `vec3 gradient2(vec2 st, float tick)` — Rotating yellow→red linear gradient
- `vec3 gradient3(vec2 st, float tick)` — Rotating magenta→cyan linear gradient
- `vec3 gradients(int type, vec2 st, float tick)` — Dispatcher: type 1=gradient1, 2=gradient2, 3=gradient3

**Inputs:** gradient type (int), UV coordinates, animation tick
**Outputs:** RGB color

---

### E.3) `src/glsl/radial-rainbow.glsl`

**Used by:** cube/shader.frag.glsl (via `#include`)

**Function:** `vec4 radialRainbow(vec2 st, float tick)`

Creates an animated radial color wheel with 10 color bands (5 colors: blue, green, magenta, red, yellow). The angle is computed from screen center using atan, offset by `sin(tick * 0.002)` for rotation animation. Colors blend smoothly between bands using smoothstep.

**Requires:** `PI2` to be defined in consumer shader
**Inputs:** screen-space UV, animation tick
**Outputs:** RGBA color

---

### E.4) `src/components/cube/shader.vert.glsl`

**Attributes:**
| Name | Type | Meaning | Set in JS |
|------|------|---------|-----------|
| `a_position` | vec3 | Vertex position [-1,1] | config.ts positions |
| `a_center` | vec3 | Face center position | config.ts centers |
| `a_uv` | vec2 | Texture coordinates [0,1] | config.ts uv |
| `a_color` | vec3 | Face mask color (RGB) | config.ts colors |

**Uniforms:**
| Name | Type | Meaning | Set in JS |
|------|------|---------|-----------|
| `u_projection` | mat4 | Perspective projection matrix | camera.ts |
| `u_view` | mat4 | Camera view matrix | camera.ts |
| `u_world` | mat4 | World/model matrix | cube/index.ts context.world |

**Varyings (output):**
| Name | Type | Meaning |
|------|------|---------|
| `v_normal` | vec3 | Normalized position (used as cubemap lookup direction) |
| `v_center` | vec3 | Projected face center (clip space) |
| `v_point` | vec3 | Projected vertex (clip space) |
| `v_uv` | vec2 | Texture coordinates |
| `v_color` | vec3 | Face mask color |
| `v_depth` | float | Camera-space Z depth (for opacity modulation) |

---

### E.5) `src/components/cube/shader.frag.glsl`

**Uniforms:**
| Name | Type | Meaning | Set in JS |
|------|------|---------|-----------|
| `u_resolution` | vec2 | Viewport width/height | camera.ts |
| `u_face` | int | -1 = front face, 1 = back face | cube/index.ts context.face |
| `u_typeId` | int | 1=displacement, 2=mask, 3=final | regl.prop('typeId') |
| `u_texture` | sampler2D | Content FBO texture (back face) | regl.context('texture') |
| `u_reflection` | samplerCube | Reflection cubemap (front face) | regl.context('reflection') |
| `u_tick` | float | Frame counter | regl.context('tick') |
| `u_borderWidth` | float | Rainbow stroke width (default 0.008) | cube CONFIG |
| `u_displacementLength` | float | Edge displacement intensity (default 0.028) | cube CONFIG |
| `u_reflectionOpacity` | float | Reflection alpha (default 0.3) | cube CONFIG |
| `u_scene` | int | Debug: 1/2/3 override, 3=normal | cube CONFIG |

**Includes:** borders.glsl, radial-rainbow.glsl

**Mode Logic:**
- **type1() — Displacement:** Computes angle from projected center→point using atan. Computes displacement using borders() at two scales. Outputs vec4(angle, displacement, 0, 1).
- **type2() — Mask:** Outputs vec4(v_color, 1.0) — the face's color-encoded mask ID.
- **type3() — Final:** Computes rainbow border stroke via radialRainbow() * borders(). For front face (u_face=-1): cubemap reflection lookup, alpha modulated by reflectionOpacity * depth. For back face: samples content texture. Composites stroke over texture.

---

### E.6) `src/components/content/shader.vert.glsl`

**Attributes:** `a_position` (vec3), `a_uv` (vec2)
**Uniforms:** `u_projection`, `u_view`, `u_world` (mat4)
**Varyings:** `v_uv` (vec2)

Simple MVP transform, passes UV to fragment.

---

### E.7) `src/components/content/shader.frag.glsl`

**Uniforms:**
| Name | Type | Meaning | Set in JS |
|------|------|---------|-----------|
| `u_resolution` | vec2 | Viewport size | camera.ts |
| `u_texture` | sampler2D | Face texture (logo/text) | regl.prop('texture') |
| `u_maskId` | int | Which mask to render (1-5) | regl.prop('maskId') |
| `u_typeId` | int | Gradient type (1=rainbow, 2=blue, 3=red) | regl.prop('typeId') |
| `u_displacement` | sampler2D | Displacement FBO | regl.context('displacement') |
| `u_mask` | sampler2D | Mask FBO | regl.context('mask') |
| `u_tick` | float | Frame counter | regl.context('tick') |

**Includes:** gradients.glsl

**Logic:**
1. Read displacement FBO at screen UV → direction vector (from angle) + length
2. Displace texture UV by `length * 0.07 * direction`
3. Sample texture at displaced UV
4. Compute animated gradient color: `gradients(u_typeId, v_uv, tick * 0.009)`
5. Blend: `texture.rgb = color + (texture.rgb * color)`
6. Read mask FBO, decode mask ID: `int(R*4 + G*2 + B*1)`
7. If decoded maskId matches u_maskId → output; else discard

---

### E.8) `src/components/reflection/plane/shader.vert.glsl`

**Attributes:** `a_position` (vec3)
**Uniforms:** `u_textureMatrix` (mat4), `u_world` (mat4)
**Varyings:** `vUv` (vec4) — homogeneous texture coordinates

Transforms position by textureMatrix for perspective-correct texture projection. gl_Position uses u_world only.

---

### E.9) `src/components/reflection/plane/shader.frag.glsl`

**Uniforms:** `u_texture` (sampler2D)
**Input:** `vUv` (vec4)

Single operation: `texture2DProj(u_texture, vUv)` — perspective-correct texture lookup.

---

### E.10) `src/components/reflection/reflector/shader.vert.glsl`

**Attributes:** `a_position` (vec3), `a_uv` (vec2)
**Uniforms:** `u_projection`, `u_view`, `u_world` (mat4), `u_viewport` (vec2)
**Varyings:** `v_uv` (vec2), `v_z` (float)

Computes depth: `v_z = 1.0 - (mat3(u_view) * mat3(u_world) * a_position).z`

---

### E.11) `src/components/reflection/reflector/shader.frag.glsl`

**Uniforms:** `u_resolution` (vec2), `u_texture` (sampler2D), `u_depthOpacity` (float, default 0.25)

Samples texture at v_uv, reduces alpha by `u_depthOpacity * v_z` for depth-based fade effect. Objects further from camera appear more transparent.

---

## F) Assets

| Asset | Type | Size | How Loaded | Where Used |
|-------|------|------|------------|------------|
| `src/assets/logo.png` | PNG texture | 36KB | Vite static import → Image() → regl.texture({ flipY, min:'mipmap' }) | Faces M1-M5 (currently all use logo) |
| `src/assets/text-1.png` | PNG texture | 20KB | Same as above | Available for face M4 (top) |
| `src/assets/text-2.png` | PNG texture | 20KB | Same as above | Available for face M5 (bottom) |

**Texture Parameters:**
- `flipY: true` — flips Y axis for correct orientation
- `min: 'mipmap'` — mipmapped minification filter
- Loaded asynchronously; REGL texture starts empty and updates on image.onload

**Face → Texture → Gradient Mapping:**

| Mask ID | Face(s) | Texture | Gradient Type |
|---------|---------|---------|---------------|
| M1 (1) | Right | logo.png | RAINBOW (1) |
| M2 (2) | Back | logo.png | BLUE (2) |
| M3 (3) | Front + Left | logo.png | RED (3) |
| M4 (4) | Top | logo.png | BLUE (2) |
| M5 (5) | Bottom | logo.png | RED (3) |

---

## G) HTML/CSS/DOM Integration

### Canvas Creation

REGL creates its own `<canvas>` element and appends it to the container. In Scene.tsx:
```tsx
<div ref={containerRef} className="content" />
```
The `createRenderer()` function passes this div as `container` to `createREGL()`, which auto-creates and manages the canvas.

### CSS Layout (index.css)

```css
.content {
    display: flex;
    width: 100vw;
    height: 100vh;
    position: relative;
    justify-content: center;
    align-items: center;
}
```

Background: `--color-bg: #fff` (white). The canvas fills the `.content` div. dat.GUI panel (when visible) is positioned at z-index 10000.

### React Component Hierarchy

```
main.tsx
  └─ <StrictMode>
       └─ <App>
            └─ <Scene />     ← owns all WebGL state
                 └─ <div.content>
                      └─ <canvas> (auto-created by REGL)
```

---

## H) Animation + Interaction

### Time Step Logic

REGL provides `tick` (integer frame counter) via `regl.frame()` callback context. The rotation is computed as:
```
factor = tick * CONFIG.velocity (0.009)
```
Two rotation layers:
1. Static rotation: `CONFIG.rotation` (4.8 rad) around `[rotateX, rotateY, rotateZ]`
2. Animated rotation: `factor` around `[cos(factor), sin(factor), 0.5]` — creates orbital wobble

Rainbow border animation: `radialRainbow(st, tick)` uses `sin(tick * 0.002)` for slow rotation.
Gradient animation: `gradients(type, uv, tick * 0.009)` — gradient2/3 rotate based on tick.

### Input Mapping

No mouse/touch/scroll interaction. The cube rotates automatically based on frame tick. All parameters are adjustable via dat.GUI in debug mode.

### Resize Handling

- REGL auto-resizes its canvas to fit the container
- FBOs are explicitly resized each frame: `displacementFbo.resize(viewportWidth, viewportHeight)`
- Camera projection matrix recomputes aspect ratio each frame from `viewportWidth/viewportHeight`
- No explicit DPR/retina handling (REGL uses default device pixel ratio)

### dat.GUI Controls (debug mode)

**Main folder:** cameraX/Y/Z, rotation, rotateX/Y/Z, velocity
**Cube folder:** translateX/Y/Z, rotation, rotateX/Y/Z, scale, borderWidth, displacementLength, reflectionOpacity, scene (Apple/Mask/Displacement)
**Content folder:** translateX/Y/Z, rotation, rotateX/Y/Z, scale
**Camera folder:** fov
**Reflector folder:** depthOpacity

---

## I) Troubleshooting & Gotchas

### Shader Compilation

- **PI2 redefinition:** The utility files `radial-rainbow.glsl` and `gradients.glsl` originally defined `const float PI2`. Since `#include` inlines the file, this conflicts with `PI2` defined in consumer shaders. Solution: PI2 is removed from utility files; consumers define it before `#include`.
- **`#include` paths:** Must be relative from the shader file's location. From `cube/shader.frag.glsl` → `../../glsl/borders.glsl`.
- **GLSL precision:** All shaders use `precision mediump float` for WebGL 1 compatibility.

### glslify → vite-plugin-glsl Migration

- Source: `#pragma glslify: borders = require(../../../glsl/borders.glsl)` + `#pragma glslify: export(borders)`
- Target: `#include "../../glsl/borders.glsl"` — just inlines the file, function is available directly
- Utility files: removed `#pragma glslify: export(...)` lines

### REGL in React

- Source used module-scope singletons (`export const regl = Regl(...)`). React can't do this because DOM isn't ready at import time.
- Solution: Factory functions (`createRenderer`, `createCamera`, `createCube`, etc.) that accept `regl` instance.
- Cleanup: `regl.destroy()` in useEffect return stops the animation loop and releases WebGL resources.

### Asset Loading

- Source used Webpack's `require('~assets/logo.png')` with file-loader. Vite uses `import logoUrl from '../assets/logo.png'` which resolves to a URL string.
- Textures load asynchronously — the cube renders with empty textures initially, then updates when images load.

### Webpack → Vite Aliases

- Source: `~js`, `~css`, `~assets`, `~glsl` (webpack resolve.alias)
- Target: Standard relative imports, no aliases needed

### Common Issues

1. **Black cube / no content:** Textures haven't loaded yet. Check network tab for 404s on asset URLs.
2. **Shader errors:** Check browser console for GLSL compilation errors. Usually caused by `#include` path issues or duplicate constant definitions.
3. **No reflections:** Ensure `reflectionFbo.framebufferCube(1024)` succeeded. WebGL may fail silently on very old GPUs.
4. **No GUI panel:** Add `?debug=true` to URL or run in dev mode.
5. **StrictMode double-mount:** React 19 StrictMode mounts effects twice in dev. This creates two REGL contexts. The first is cleaned up, but you may see a brief flash.

### Debug Tips

- Set `scene` to "Displacement" or "Mask" in GUI to visualize intermediate passes
- Check `regl.stats` for draw call counts and resource usage
- Use browser's WebGL inspector extensions to examine FBO contents
- Log uniforms by temporarily adding `console.log` in context functions

---

## J) Licensing / Attribution Notes

### Source Repository

- **Repo:** https://github.com/lorenzocadamuro/apple-fifth-avenue
- **Author:** Lorenzo Cadamuro (http://lorenzocadamuro.com)
- **License:** ISC License (per package.json)
- **Context:** Created as a tutorial/demo for Codrops (https://tympanus.net/codrops)

### ISC License Summary

The ISC license is permissive (similar to MIT). It allows:
- Commercial use
- Modification
- Distribution
- Private use

**Requirement:** Include the original copyright notice and license text in copies.

### Asset Attribution

The texture assets (logo.png, text-1.png, text-2.png) are from the source repo. The Apple logo is Apple Inc.'s trademark and is used here for educational/demo purposes only. It should not be used in production applications without Apple's permission.

### Dependencies

All npm dependencies use permissive open-source licenses (MIT, ISC, BSD). No copyleft (GPL) dependencies are included.

---

## Deviations from Source

| Change | Reason |
|--------|--------|
| Webpack → Vite | Target repo uses Vite |
| Vanilla JS → React + TypeScript | Target repo framework |
| `#pragma glslify` → `#include` | vite-plugin-glsl syntax |
| Module singletons → factory functions | React lifecycle compatibility |
| `require('~assets/...')` → Vite imports | Different bundler asset handling |
| `devMode` global → `import.meta.env.DEV` | Vite environment variable |
| `alpha: false` → `alpha: true` in REGL | Allows transparent canvas background |
| All faces use logo.png | User customization (source used text-1/text-2 for top/bottom) |
| Background color: white | User customization (source used black) |
