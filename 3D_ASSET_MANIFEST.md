# Манифест 3D-ассетов, оптимизации и WebGL-конвейера (`3D_ASSET_MANIFEST.md`)

**Рендер-стек:** Three.js r128 (`js/vendor/three.min.js`) + `GLTFLoader` + `OrbitControls` + `RGBELoader` + `PMREMGenerator` + `EffectComposer` + `UnrealBloomPass`  
**Суммарный вес медиа и 3D-активов:** **77.73 МБ** (368 файлов в `assets/models`, `assets/photoreal`, `assets/hdri`, `assets/lesson-intros`).

---

## 1. Сводная инвентаризация активов

| Каталог | Файлов | Фактический размер | Назначение | Статус после M3 |
|---|---:|---:|---|---|
| `assets/models/*.glb` | 25 | **1.38 МБ** (`1 447 196` Б, снижено с `31.62 МБ`) | 25 профильных моделей (по 5 на каждую из 5 специальностей) для `workshop-models.js` | **VERIFIED:** 25 уникальных SHA-256 хешей; именованные семантические узлы (`part_valve_cover`, `part_cylinder_head`, `part_piston_01` и др.); все файлы `<= 162 КБ`. |
| `assets/photoreal/*` | 42 | **17.49 МБ** (`18 337 107` Б) | Фотограмметрические сканы Poly Haven CC0 (`.gltf` + `.bin` + 1k `.jpg` PBR-текстуры) | Подключены профили `LOW` / `BALANCED` / `ULTRA` (`window.EduGraphicsProfile`) и `disposeThreeScene()`. |
| `assets/hdri/studio_small_09_1k.hdr` | 1 | **1.54 МБ** (`1 615 248` Б) | Студийная HDRI карта окружения (`RGBELoader` + `PMREMGenerator`) | Автоопределение `HalfFloatType` с безопасным fallback на `UnsignedByteType`. |
| `assets/lesson-intros/*` | 300 | **27.08 МБ** (`28 400 510` Б) | 100 `.mp4` + 100 `.jpg` + 100 `.vtt` (по 20 на каждую из 5 специальностей) | Подключены во вкладку «Видео-обзор урока» (`#lp-tab-video` / `#step-btn-video`) с `preload="metadata"`. |

---

## 2. Полный реестр 25 моделей `assets/models/*.glb` (После оптимизации M3)

| # | Курс (`slug`) | Файл | Размер до M3 (Б) | Размер после M3 (Б) | SHA-256 (первые 16 симв.) | Статус |
|---|---|---|---:|---:|---|---|
| 1 | `automechanic` | `mech-turbo.glb` | `11 778 688` | `47 516` | `C0ED1704A0F30813` | `[x] VERIFIED` (именованные узлы турбокомпрессора) |
| 2 | `automechanic` | `mech-suspension.glb` | `7 885 636` | `34 492` | `711A6473F2C7BF32` | `[x] VERIFIED` (именованные узлы подвески MacPherson) |
| 3 | `automechanic` | `mech-transmission.glb` | `4 958 788` | `31 872` | `3B6A1E44B03061B3` | `[x] VERIFIED` (именованные узлы МКПП и дифференциала) |
| 4 | `automechanic` | `mech-cylinder.glb` | `1 838 084` | `48 520` | `0F75AAB64D31B23B` | `[x] VERIFIED` (эталонная мастерская ДВС/ГБЦ, дедуплицирована) |
| 5 | `automechanic` | `mech-brakes.glb` | `104 904` | `20 788` | `859C893C0964A956` | `[x] VERIFIED` (именованные узлы тормозного суппорта и диска) |
| 6 | `autoelectric` | `autoel-charging.glb` | `3 562 996` | `30 024` | `295F552955E1431E` | `[x] VERIFIED` (именованные узлы генератора и АКБ) |
| 7 | `autoelectric` | `autoel-can.glb` | `162 000` | `162 000` | `D0B2F00AE142AFC1` | `[x] VERIFIED` |
| 8 | `autoelectric` | `autoel-ignition.glb` | `54 836` | `54 836` | `95E81B14454559AF` | `[x] VERIFIED` |
| 9 | `autoelectric` | `autoel-sensors.glb` | `37 712` | `37 712` | `8010FEDFF2E5D199` | `[x] VERIFIED` |
| 10 | `autoelectric` | `autoel-hv.glb` | `25 484` | `25 484` | `54B4405DF0BD6F3C` | `[x] VERIFIED` |
| 11 | `hvac` | `hvac-chiller.glb` | `1 838 084` | `43 552` | `74184A63E4AFCBBA` | `[x] VERIFIED` (уникальная сборка чиллера, дедуплицирована) |
| 12 | `hvac` | `hvac-cycle.glb` | `113 140` | `113 140` | `D07D5E175BD31D39` | `[x] VERIFIED` |
| 13 | `hvac` | `hvac-inverter.glb` | `110 892` | `110 892` | `1BEFE7249862AB85` | `[x] VERIFIED` |
| 14 | `hvac` | `hvac-service.glb` | `69 444` | `69 444` | `10F195C578F7B468` | `[x] VERIFIED` |
| 15 | `hvac` | `hvac-vrf.glb` | `42 912` | `42 912` | `51AFA679751B954F` | `[x] VERIFIED` |
| 16 | `graphic_design` | `design-lighting.glb` | `72 248` | `72 248` | `D48108921F6DAA14` | `[x] VERIFIED` |
| 17 | `graphic_design` | `design-brand.glb` | `61 912` | `61 912` | `FE5BBA1CC66F7B22` | `[x] VERIFIED` |
| 18 | `graphic_design` | `design-color.glb` | `58 840` | `58 840` | `37992A46BDD8F093` | `[x] VERIFIED` |
| 19 | `graphic_design` | `design-packaging.glb` | `49 844` | `49 844` | `57B976BEA6725480` | `[x] VERIFIED` |
| 20 | `graphic_design` | `design-typography.glb` | `45 144` | `45 144` | `BED49D33200980A7` | `[x] VERIFIED` |
| 21 | `it` | `it-security.glb` | `69 792` | `69 792` | `4070CA9063F08241` | `[x] VERIFIED` |
| 22 | `it` | `it-server.glb` | `62 804` | `62 804` | `ABB6D2DDA0CD3F82` | `[x] VERIFIED` |
| 23 | `it` | `it-webgl.glb` | `55 764` | `55 764` | `9AE0D3D95A873D56` | `[x] VERIFIED` |
| 24 | `it` | `it-dom.glb` | `52 124` | `52 124` | `2FFBC92782302338` | `[x] VERIFIED` |
| 25 | `it` | `it-grid.glb` | `45 540` | `45 540` | `DE9ACC389B25DB8F` | `[x] VERIFIED` |

**Итог дедупликации и сжатия (`scripts/build_optimized_glbs.py`):**
- **25 уникальных SHA-256 хешей** подтверждены (`tests/test_m2_m6_comprehensive.py::test_03_m3_glb_deduplication_and_size_budget`).
- **Суммарный вес `assets/models/*.glb`:** снижен с `31.62 МБ` до **`1.38 МБ`** (`1 447 196` Б, экономия `95.6%`).

---

## 3. Инвентарь фотограмметрических сканов `assets/photoreal/*`

| Папка скана | Файлы | Общий размер | Применение |
|---|---|---:|---|
| `classic_laptop/` | `.gltf`, `.bin`, 3× 1k `.jpg` (`arm`, `diff`, `nor_gl`) | `2.18 МБ` | Шоукейс курса `it` (Web-разработка) |
| `spray_paint_bottles/` | `.gltf`, `.bin`, 6× 1k `.jpg` (`arm`, `diff`, `nor_gl` ×2) | `2.26 МБ` | Шоукейс курса `graphic_design` |
| `retro_multimeter/` | `.gltf`, `.bin`, 3× 1k `.jpg` | `1.39 МБ` | Шоукейс курса `autoelectric` |
| `exterior_aircon_unit/` | `.gltf`, `.bin`, 12× 1k `.jpg` (`diff`, `arm`, `nor_gl`, `opacity`) | `6.43 МБ` | Шоукейс курса `hvac` (самый тяжёлый скан — кандидат на даунскейл `opacity`/`nor_gl` для `LOW`) |
| `rusted_wheel_rim_01/` | `.gltf`, `.bin`, 3× 1k `.jpg` | `2.60 МБ` | Шоукейс курса `automechanic` |
| `old_tyre/` | `.gltf`, `.bin`, 3× 1k `.jpg` | `2.25 МБ` | Резервный скан (не смонтирован на `index.html`, подключить в каталоге/сцене шиномонтажа или пометить как резерв) |

---

## 4. Семантическая схема именования узлов эталонной 3D-мастерской (Автомеханика)

Для замены слепого нарезания мешей `Math.floor(mIdx / groupSize)` (`workshop-models.js:1047`) все узлы эталонной мастерской Автомеханики обязаны иметь семантические имена `node.name` (в GLB и/или в процедурном конструкторе сцены):

| Подсборка (`model_key`) | Обязательные именованные узлы (`node.name`) | Допустимый инструмент | Зависимости разборки (DAG) |
|---|---|---|---|
| **Двигатель / ГБЦ (`mech-cylinder`)** | `part_valve_cover`, `part_bolt_01`..`part_bolt_10`, `part_camshaft_intake`, `part_camshaft_exhaust`, `part_cylinder_head`, `part_gasket_head`, `part_piston_01`, `part_piston_02`, `part_crankshaft`, `part_cylinder_block` | `socket_wrench`, `torque_wrench`, `feeler_gauge`, `inspect` | `valve_cover` → `bolt_01..10` → `camshaft_*` → `cylinder_head` → `gasket_head` → `piston_*` |
| **Тормозная система (`mech-brakes`)** | `part_wheel_hub`, `part_caliper_bolts`, `part_caliper_body`, `part_brake_pads`, `part_brake_rotor`, `part_abs_line`, `part_master_cylinder` | `socket_wrench`, `torque_wrench`, `caliper`, `inspect` | `caliper_bolts` → `caliper_body` → `brake_pads` → `brake_rotor` |
| **Подвеска и рулевое (`mech-suspension`)** | `part_strut_top_mount`, `part_coil_spring`, `part_shock_absorber`, `part_control_arm`, `part_ball_joint`, `part_steering_rack`, `part_tie_rod` | `socket_wrench`, `torque_wrench`, `inspect` | `strut_top_mount` → `coil_spring` → `shock_absorber`; `tie_rod` → `steering_rack` |
| **Турбонаддув (`mech-turbo`)** | `part_air_intake`, `part_compressor_housing`, `part_turbine_housing`, `part_chra_cartridge`, `part_intercooler`, `part_wastegate_actuator` | `socket_wrench`, `feeler_gauge`, `inspect` | `air_intake` → `compressor_housing` → `chra_cartridge` |
| **Трансмиссия (`mech-transmission`)** | `part_bell_housing`, `part_gearbox_pan`, `part_input_shaft`, `part_synchro_hub`, `part_output_shaft`, `part_differential` | `socket_wrench`, `torque_wrench`, `feeler_gauge`, `inspect` | `gearbox_pan` → `synchro_hub` → `input_shaft` / `output_shaft` |

Каждый узел при `Raycaster`-наведении/клике предоставляет метаданные: `partId`, `labelRu`, `labelKk`, `torqueSpecNm` (при наличии), `wearLimitMm`, `explodeVector [x, y, z]`, `prerequisites: []`.

---

## 5. PBR, HDRI, тени и профили графики (`LOW` / `BALANCED` / `ULTRA`)

| Параметр | `LOW` | `BALANCED` (по умолчанию) | `ULTRA` |
|---|---|---|---|
| `renderer.setPixelRatio` | `1.0` | `Math.min(window.devicePixelRatio, 1.5)` | `Math.min(window.devicePixelRatio, 2.0)` |
| `antialias` | `false` | `true` | `true` |
| Тени (`shadowMap`) | Выключены (`enabled = false`) | `PCFSoftShadowMap`, `1024×1024` | `PCFSoftShadowMap`, `2048×2048` |
| HDRI & ToneMapping | Процедурный softbox envMap, `ACESFilmic` | `studio_small_09_1k.hdr` (`UnsignedByteType` или `HalfFloatType`) | `studio_small_09_1k.hdr` (`HalfFloatType` при поддержке GPU) + `PMREMGenerator` |
| Post-processing (`Bloom`) | Выключен | Выключен (макс. FPS) | `EffectComposer` + `UnrealBloomPass` (порог 0.85, сила 0.28) |
| Физика и Raycast | Активны полностью (бизнес-логика не меняется) | Активны полностью | Активны полностью |

**Ленивая загрузка:** модели и фотосканы грузятся через `IntersectionObserver` (загружается только активная вкладка/модель, а не все 25 GLB сразу), с кешем в памяти сессии (`Map`) и переиспользованием HDRI `PMREM`.

---

## 6. Правила освобождения ресурсов WebGL (`disposeThreeScene()`)

Для полного устранения утечек GPU-памяти (дефект `AUD-3D-04`) **все** 3D-движки (`workshop-models.js`, `eduspace-3d-engine.js`, `photoreal-showcase.js`, `starter-lesson.js`, новый `workshop-3d-engine.js`) обязаны вызывать единую функцию `disposeThreeScene(ctx)` при смене модели, переключении урока и событии `pagehide`/`beforeunload`:

1. Остановить `cancelAnimationFrame(ctx.rafId)`.
2. Отключить `ctx.resizeObserver?.disconnect()` и снять все `window` / `document` / `canvas` слушатели (`pointermove`, `pointerup`, `keydown`, `resize`).
3. Вызвать `ctx.controls?.dispose()`.
4. Обойти `ctx.scene.traverse((obj) => ...)`:
   - `obj.geometry?.dispose()`
   - для каждого материала (включая массив материалов): перебрать все texture-слоты (`map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `emissiveMap`, `alphaMap`, `envMap`), вызвать `tex.dispose()`, затем `mat.dispose()`.
5. Освободить `ctx.scene.environment?.dispose()`, `ctx.pmremTarget?.dispose()`, `ctx.pmremGenerator?.dispose()`, `ctx.composer?.dispose()`, `ctx.contactShadowTarget?.dispose()`.
6. Вызвать `ctx.renderer?.dispose()` и `ctx.renderer?.forceContextLoss?.()`, обнулить ссылки в `ctx`.
7. **Критерий верификации:** после 10 циклов монтирования и размонтирования 3D-сцены `renderer.info.memory.geometries` и `renderer.info.memory.textures` не растут монотонно (возвращаются к базовому значению).
