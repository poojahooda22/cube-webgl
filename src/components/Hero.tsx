import Scene from './Scene'

const Hero = () => {
    return (
        <>
            <div className="ambient">
                <div className="glow glow-blue"></div>
                <div className="glow glow-green"></div>
                <div className="glow glow-magenta"></div>
            </div>
            <div className="grain"></div>

            {/* ═══ NAVBAR ═══ */}
            <nav>
                <a className="nav-logo" href="#">
                    <div className="logo-prism">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style={{ position: 'relative', zIndex: 2 }}>
                            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                        </svg>
                    </div>
                    <span className="logo-name">studio.dev</span>
                </a>

                <ul className="nav-links">
                    <li><a href="#" className="active">Work</a></li>
                    <li><a href="#">Projects</a></li>
                    <li><a href="#">About</a></li>
                    <li><a href="#">Journal</a></li>
                </ul>

                <div className="nav-right">
                    <div className="nav-status">
                        <span className="pulse-dot"></span>
                        Available
                    </div>
                    <button className="nav-cta">Let's Talk</button>
                </div>
            </nav>

            {/* ═══ HERO ═══ */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-tag">
                        <span className="tag-dot">✦</span>
                        Open for Q2 2026 projects
                    </div>

                    <h1 className="hero-h1">
                        Crafting Digital<br />
                        <span className="grad-full">Experiences</span> That<br />
                        Feel Alive
                    </h1>

                    <p className="hero-desc">
                        I design and develop immersive interfaces where glass, light, and motion converge — creating products people can't forget.
                    </p>

                    <div className="hero-actions">
                        <button className="btn-prism"><span>View Projects</span></button>
                        <button className="btn-outline">
                            Watch Reel
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                        </button>
                    </div>

                    <div className="hero-metrics">
                        <div className="metric">
                            <span className="metric-val">40+</span>
                            <span className="metric-label">Projects</span>
                        </div>
                        <div className="metric">
                            <span className="metric-val">5yr</span>
                            <span className="metric-label">Experience</span>
                        </div>
                        <div className="metric">
                            <span className="metric-val">98%</span>
                            <span className="metric-label">Satisfaction</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual">
                    <div className="cube-stage">
                        <div className="prism-ring-outer"></div>
                        <div className="prism-ring"></div>

                        <div className="particle p1"></div>
                        <div className="particle p2"></div>
                        <div className="particle p3"></div>
                        <div className="particle p4"></div>

                        <div className="tech-tag tag-1">
                            <span className="td" style={{ background: 'var(--blue)' }}></span>
                            WebGL 2.0
                        </div>
                        <div className="tech-tag tag-2">
                            <span className="td" style={{ background: 'var(--green)' }}></span>
                            Three.js / GLSL
                        </div>

                        <div className="asset-placeholder">
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    zIndex: 0
                                }}
                            >
                                <Scene />
                            </div>
                            {/* Optional: Overlay labels from original template if desired */}
                            {/* <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <span className="asset-label">Your 3D WebGL Cube</span>
                <span className="asset-sublabel">Mount your &lt;canvas&gt; here</span>
              </div> */}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Hero
