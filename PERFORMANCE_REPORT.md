# PERFORMANCE REPORT — AMK SKILLHUB × NYVOR

## 1. Script & Bundle Optimizations
- **Removed 8 Unused Shader Scripts from `index.html`**: Eliminated `CopyShader.js`, `LuminosityHighPassShader.js`, `HorizontalBlurShader.js`, `VerticalBlurShader.js`, `EffectComposer.js`, `RenderPass.js`, `ShaderPass.js`, and `UnrealBloomPass.js` from initial page load (8 fewer blocking HTTP requests on landing page).
- **Removed Dead Code**: Deleted unused `js/showcase-dioramas.js` and stray `%SystemDrive%` directory.
- **Zero External CDN Dependencies**: Tailwind CSS (`css/tailwind.min.css`), Web Fonts (`assets/fonts/*.woff2`), and Three.js (`assets/vendor/three/`) are served locally with HTTP cache headers (`Cache-Control: public, max-age=31536000, immutable` for static assets).
- **Lazy Catalog Chunks**: Course curricula (`js/data/curriculum/*.json`) load on demand per specialty while preserving offline fallback.
- **3D Draco Compression**: All 5 specialty `.glb` models in `assets/models/` use Draco mesh compression (`assets/vendor/three/draco/`) with `requestAnimationFrame` pause when offscreen (`IntersectionObserver`).
