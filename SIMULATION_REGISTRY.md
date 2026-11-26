# SIMULATION REGISTRY — AMK SKILLHUB × NYVOR

| Simulator ID | Module | Physics / Logic Engine | Deterministic Verification | Status |
|---|---|---|---|---|
| `SIM-AE-01` | Automotive Electrical Multimeter & Circuit Solver | `window.EduPhysics.autoelectric.solveCircuit` (`U = I * R`, voltage drop, fuse blow threshold) | Zero `Math.random()`, deterministic Ohm/Kirchhoff laws | `VERIFIED` |
| `SIM-AM-01` | Internal Combustion Engine & Torque Bench | `window.EduPhysics.automechanic.engineMetrics` (`RPM`, torque curve, thermal expansion, plastigage clearance) | Deterministic mechanical equations | `VERIFIED` |
| `SIM-GD-01` | NyVor Graphic Design Studio & Binary Exporter | HTML5 2D Canvas + 10 Commercial Presets + `canvas.toBlob()` (`image/webp`, `image/png`, `image/jpeg`) | Real binary Blob generation & byte size measurement | `VERIFIED` |
| `SIM-IT-01` | Full-Stack Code Sandbox (Python / JS / SQL) | Backend `/api/code/execute` AST-validated sandbox + unit test runner | Deterministic test assertions against student code | `VERIFIED` |
| `SIM-HV-01` | HVAC R410A Refrigeration Cycle & Manifold Station | `window.EduPhysics.hvac.cycleMetrics` (Antoine saturation pressure-temperature, superheat, subcooling, COP) | Zero `Math.random()`, thermodynamic equations | `VERIFIED` |
