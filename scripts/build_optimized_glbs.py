#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates domain-accurate, semantic named-node glTF 2.0 binary (.glb) models
for the 6 oversized/duplicate assets + mech-brakes semantic node upgrade per 3D_ASSET_MANIFEST.md:
  - mech-cylinder.glb (Engine block, head, gasket, 10 bolts, camshafts, pistons, crankshaft, valve cover)
  - mech-brakes.glb (Wheel hub, caliper bolts, caliper body, brake pads, brake rotor, ABS line, master cylinder)
  - mech-suspension.glb (Strut top mount, coil spring, shock absorber, control arm, ball joint, steering rack, tie rod)
  - mech-turbo.glb (Air intake, compressor housing, turbine housing, CHRA cartridge, intercooler, wastegate actuator)
  - mech-transmission.glb (Bell housing, gearbox pan, input shaft, synchro hub, output shaft, differential)
  - hvac-chiller.glb (Scroll compressor, condenser coil, evaporator shell, TXV valve, receiver, twin axial fans)
  - autoel-charging.glb (Stator winding, rotor armature, rectifier bridge, PWM regulator, planetary gear, ground housing)
"""
from __future__ import annotations

import glob
import hashlib
import json
import math
import os
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(ROOT, "assets", "models")


def make_box_mesh(sx: float, sy: float, sz: float):
    hx, hy, hz = sx * 0.5, sy * 0.5, sz * 0.5
    faces = [
        # +Z
        ((-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz), (0, 0, 1)),
        # -Z
        ((hx, -hy, -hz), (-hx, -hy, -hz), (-hx, hy, -hz), (hx, hy, -hz), (0, 0, -1)),
        # +X
        ((hx, -hy, hz), (hx, -hy, -hz), (hx, hy, -hz), (hx, hy, hz), (1, 0, 0)),
        # -X
        ((-hx, -hy, -hz), (-hx, -hy, hz), (-hx, hy, hz), (-hx, hy, -hz), (-1, 0, 0)),
        # +Y
        ((-hx, hy, hz), (hx, hy, hz), (hx, hy, -hz), (-hx, hy, -hz), (0, 1, 0)),
        # -Y
        ((-hx, -hy, -hz), (hx, -hy, -hz), (hx, -hy, hz), (-hx, -hy, hz), (0, -1, 0)),
    ]
    positions = []
    normals = []
    indices = []
    for f_idx, (p0, p1, p2, p3, n) in enumerate(faces):
        base = f_idx * 4
        for p in (p0, p1, p2, p3):
            positions.extend(p)
            normals.extend(n)
        indices.extend([base, base + 1, base + 2, base, base + 2, base + 3])
    return positions, normals, indices


def make_cylinder_mesh(radius_top: float, radius_bot: float, height: float, segs: int = 24, axis: str = "y"):
    hy = height * 0.5
    positions = []
    normals = []
    indices = []

    def rot(x, y, z):
        if axis == "x":
            return (y, x, z)
        if axis == "z":
            return (x, z, y)
        return (x, y, z)

    # Side ring
    for i in range(segs + 1):
        theta = (i / segs) * math.tau
        c, s = math.cos(theta), math.sin(theta)
        positions.extend(rot(radius_top * c, hy, radius_top * s))
        normals.extend(rot(c, 0.0, s))
        positions.extend(rot(radius_bot * c, -hy, radius_bot * s))
        normals.extend(rot(c, 0.0, s))

    for i in range(segs):
        b = i * 2
        indices.extend([b, b + 1, b + 3, b, b + 3, b + 2])

    # Top cap
    top_center_idx = len(positions) // 3
    positions.extend(rot(0.0, hy, 0.0))
    normals.extend(rot(0.0, 1.0, 0.0))
    for i in range(segs + 1):
        theta = (i / segs) * math.tau
        c, s = math.cos(theta), math.sin(theta)
        positions.extend(rot(radius_top * c, hy, radius_top * s))
        normals.extend(rot(0.0, 1.0, 0.0))
    for i in range(segs):
        indices.extend([top_center_idx, top_center_idx + 1 + i + 1, top_center_idx + 1 + i])

    # Bottom cap
    bot_center_idx = len(positions) // 3
    positions.extend(rot(0.0, -hy, 0.0))
    normals.extend(rot(0.0, -1.0, 0.0))
    for i in range(segs + 1):
        theta = (i / segs) * math.tau
        c, s = math.cos(theta), math.sin(theta)
        positions.extend(rot(radius_bot * c, -hy, radius_bot * s))
        normals.extend(rot(0.0, -1.0, 0.0))
    for i in range(segs):
        indices.extend([bot_center_idx, bot_center_idx + 1 + i, bot_center_idx + 1 + i + 1])

    return positions, normals, indices


def make_torus_mesh(R: float, r: float, radial_segs: int = 24, tubular_segs: int = 16, axis: str = "y"):
    positions = []
    normals = []
    indices = []

    def rot(x, y, z):
        if axis == "x":
            return (y, x, z)
        if axis == "z":
            return (x, z, y)
        return (x, y, z)

    for j in range(radial_segs + 1):
        v = (j / radial_segs) * math.tau
        cv, sv = math.cos(v), math.sin(v)
        for i in range(tubular_segs + 1):
            u = (i / tubular_segs) * math.tau
            cu, su = math.cos(u), math.sin(u)
            px = (R + r * cu) * cv
            py = r * su
            pz = (R + r * cu) * sv
            nx = cu * cv
            ny = su
            nz = cu * sv
            positions.extend(rot(px, py, pz))
            normals.extend(rot(nx, ny, nz))

    stride = tubular_segs + 1
    for j in range(radial_segs):
        for i in range(tubular_segs):
            a = j * stride + i
            b = (j + 1) * stride + i
            c = (j + 1) * stride + i + 1
            d = j * stride + i + 1
            indices.extend([a, b, d, b, c, d])
    return positions, normals, indices


def build_glb_bytes(parts_spec: list[dict], generator_tag: str) -> bytes:
    """
    parts_spec: list of {
      'name': str,
      'geom': (positions, normals, indices),
      'translation': [x, y, z],
      'color': [r, g, b, a],
      'metallic': float,
      'roughness': float
    }
    """
    nodes = []
    meshes = []
    materials = []
    accessors = []
    buffer_views = []
    bin_chunks = bytearray()

    def align4(buf: bytearray):
        while len(buf) % 4 != 0:
            buf.append(0)

    for idx, part in enumerate(parts_spec):
        pos, norm, ind = part["geom"]
        v_count = len(pos) // 3
        i_count = len(ind)

        # Min/Max for POSITION accessor (required by glTF 2.0 spec)
        xs = pos[0::3]
        ys = pos[1::3]
        zs = pos[2::3]
        p_min = [min(xs), min(ys), min(zs)]
        p_max = [max(xs), max(ys), max(zs)]

        # 1. Position bufferView
        align4(bin_chunks)
        pos_offset = len(bin_chunks)
        pos_bytes = struct.pack(f"<{len(pos)}f", *pos)
        bin_chunks.extend(pos_bytes)
        pos_bv = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": pos_offset,
            "byteLength": len(pos_bytes),
            "target": 34962,
        })
        pos_acc = len(accessors)
        accessors.append({
            "bufferView": pos_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": v_count,
            "type": "VEC3",
            "min": p_min,
            "max": p_max,
        })

        # 2. Normal bufferView
        align4(bin_chunks)
        norm_offset = len(bin_chunks)
        norm_bytes = struct.pack(f"<{len(norm)}f", *norm)
        bin_chunks.extend(norm_bytes)
        norm_bv = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": norm_offset,
            "byteLength": len(norm_bytes),
            "target": 34962,
        })
        norm_acc = len(accessors)
        accessors.append({
            "bufferView": norm_bv,
            "byteOffset": 0,
            "componentType": 5126,
            "count": v_count,
            "type": "VEC3",
        })

        # 3. Indices bufferView
        align4(bin_chunks)
        ind_offset = len(bin_chunks)
        ind_bytes = struct.pack(f"<{len(ind)}H", *ind)
        bin_chunks.extend(ind_bytes)
        ind_bv = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": ind_offset,
            "byteLength": len(ind_bytes),
            "target": 34963,
        })
        ind_acc = len(accessors)
        accessors.append({
            "bufferView": ind_bv,
            "byteOffset": 0,
            "componentType": 5123,
            "count": i_count,
            "type": "SCALAR",
        })

        mat_idx = len(materials)
        materials.append({
            "name": f"mat_{part['name']}",
            "pbrMetallicRoughness": {
                "baseColorFactor": part.get("color", [0.7, 0.75, 0.8, 1.0]),
                "metallicFactor": part.get("metallic", 0.8),
                "roughnessFactor": part.get("roughness", 0.3),
            },
            "doubleSided": True,
        })

        mesh_idx = len(meshes)
        meshes.append({
            "name": f"mesh_{part['name']}",
            "primitives": [{
                "attributes": {"POSITION": pos_acc, "NORMAL": norm_acc},
                "indices": ind_acc,
                "material": mat_idx,
            }],
        })

        nodes.append({
            "name": part["name"],
            "mesh": mesh_idx,
            "translation": part.get("translation", [0.0, 0.0, 0.0]),
        })

    align4(bin_chunks)
    gltf_dict = {
        "asset": {"version": "2.0", "generator": generator_tag},
        "scene": 0,
        "scenes": [{"name": "WorkshopScene", "nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_chunks)}],
    }

    json_bytes = json.dumps(gltf_dict, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4 != 0:
        json_bytes += b" "

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_chunks)
    header = struct.pack("<4sII", b"glTF", 2, total_len)
    json_header = struct.pack("<I4s", len(json_bytes), b"JSON")
    bin_header = struct.pack("<I4s", len(bin_chunks), b"BIN\x00")
    return header + json_header + json_bytes + bin_header + bytes(bin_chunks)


def build_all():
    # 1. mech-cylinder.glb (Reference Automechanic Engine Bay: 19 named parts)
    bolt_coords = [
        (-0.55, 1.48, -0.32), (-0.28, 1.48, -0.32), (0.0, 1.48, -0.32), (0.28, 1.48, -0.32), (0.55, 1.48, -0.32),
        (-0.55, 1.48, 0.32), (-0.28, 1.48, 0.32), (0.0, 1.48, 0.32), (0.28, 1.48, 0.32), (0.55, 1.48, 0.32),
    ]
    mech_cylinder_parts = [
        {"name": "part_cylinder_block", "geom": make_box_mesh(1.55, 0.92, 0.88), "translation": [0.0, 0.52, 0.0], "color": [0.22, 0.26, 0.32, 1.0], "metallic": 0.85, "roughness": 0.38},
        {"name": "part_crankshaft", "geom": make_cylinder_mesh(0.16, 0.16, 1.48, 24, "x"), "translation": [0.0, 0.22, 0.0], "color": [0.65, 0.68, 0.72, 1.0], "metallic": 0.92, "roughness": 0.22},
        {"name": "part_piston_01", "geom": make_cylinder_mesh(0.28, 0.28, 0.38, 24, "y"), "translation": [-0.36, 0.72, 0.0], "color": [0.82, 0.85, 0.88, 1.0], "metallic": 0.88, "roughness": 0.25},
        {"name": "part_piston_02", "geom": make_cylinder_mesh(0.28, 0.28, 0.38, 24, "y"), "translation": [0.36, 0.72, 0.0], "color": [0.82, 0.85, 0.88, 1.0], "metallic": 0.88, "roughness": 0.25},
        {"name": "part_gasket_head", "geom": make_box_mesh(1.52, 0.04, 0.84), "translation": [0.0, 1.02, 0.0], "color": [0.85, 0.55, 0.18, 1.0], "metallic": 0.65, "roughness": 0.42},
        {"name": "part_cylinder_head", "geom": make_box_mesh(1.50, 0.36, 0.82), "translation": [0.0, 1.24, 0.0], "color": [0.58, 0.63, 0.70, 1.0], "metallic": 0.82, "roughness": 0.30},
        {"name": "part_camshaft_intake", "geom": make_cylinder_mesh(0.09, 0.09, 1.42, 20, "x"), "translation": [0.0, 1.52, -0.18], "color": [0.16, 0.62, 0.88, 1.0], "metallic": 0.90, "roughness": 0.24},
        {"name": "part_camshaft_exhaust", "geom": make_cylinder_mesh(0.09, 0.09, 1.42, 20, "x"), "translation": [0.0, 1.52, 0.18], "color": [0.92, 0.38, 0.24, 1.0], "metallic": 0.90, "roughness": 0.24},
        {"name": "part_valve_cover", "geom": make_box_mesh(1.46, 0.24, 0.78), "translation": [0.0, 1.74, 0.0], "color": [0.18, 0.38, 0.86, 1.0], "metallic": 0.72, "roughness": 0.28},
    ]
    for b_idx, (bx, by, bz) in enumerate(bolt_coords, 1):
        mech_cylinder_parts.append({
            "name": f"part_bolt_{b_idx:02d}",
            "geom": make_cylinder_mesh(0.045, 0.045, 0.18, 12, "y"),
            "translation": [bx, by, bz],
            "color": [0.95, 0.75, 0.22, 1.0],
            "metallic": 0.92,
            "roughness": 0.20,
        })

    # 2. mech-brakes.glb
    mech_brakes_parts = [
        {"name": "part_wheel_hub", "geom": make_cylinder_mesh(0.36, 0.36, 0.22, 24, "z"), "translation": [0.0, 0.85, 0.18], "color": [0.52, 0.56, 0.62, 1.0], "metallic": 0.88, "roughness": 0.28},
        {"name": "part_brake_rotor", "geom": make_cylinder_mesh(0.78, 0.78, 0.10, 32, "z"), "translation": [0.0, 0.85, 0.0], "color": [0.76, 0.80, 0.85, 1.0], "metallic": 0.92, "roughness": 0.22},
        {"name": "part_brake_pads", "geom": make_box_mesh(0.32, 0.44, 0.18), "translation": [0.46, 0.92, 0.0], "color": [0.92, 0.58, 0.14, 1.0], "metallic": 0.45, "roughness": 0.65},
        {"name": "part_caliper_body", "geom": make_box_mesh(0.42, 0.56, 0.28), "translation": [0.54, 0.95, 0.0], "color": [0.88, 0.18, 0.22, 1.0], "metallic": 0.75, "roughness": 0.30},
        {"name": "part_caliper_bolts", "geom": make_cylinder_mesh(0.05, 0.05, 0.26, 14, "x"), "translation": [0.72, 0.95, 0.0], "color": [0.95, 0.80, 0.25, 1.0], "metallic": 0.92, "roughness": 0.20},
        {"name": "part_abs_line", "geom": make_cylinder_mesh(0.04, 0.04, 0.95, 16, "y"), "translation": [0.65, 1.35, -0.18], "color": [0.16, 0.68, 0.92, 1.0], "metallic": 0.60, "roughness": 0.35},
        {"name": "part_master_cylinder", "geom": make_cylinder_mesh(0.18, 0.18, 0.62, 20, "x"), "translation": [-0.82, 1.25, -0.22], "color": [0.35, 0.42, 0.52, 1.0], "metallic": 0.82, "roughness": 0.32},
    ]

    # 3. mech-suspension.glb
    mech_suspension_parts = [
        {"name": "part_strut_top_mount", "geom": make_cylinder_mesh(0.28, 0.28, 0.14, 24, "y"), "translation": [0.0, 1.68, 0.0], "color": [0.24, 0.48, 0.92, 1.0], "metallic": 0.82, "roughness": 0.28},
        {"name": "part_coil_spring", "geom": make_torus_mesh(0.24, 0.06, 24, 16, "y"), "translation": [0.0, 1.15, 0.0], "color": [0.92, 0.64, 0.14, 1.0], "metallic": 0.85, "roughness": 0.25},
        {"name": "part_shock_absorber", "geom": make_cylinder_mesh(0.11, 0.11, 1.25, 24, "y"), "translation": [0.0, 0.98, 0.0], "color": [0.75, 0.80, 0.86, 1.0], "metallic": 0.92, "roughness": 0.20},
        {"name": "part_control_arm", "geom": make_box_mesh(0.95, 0.12, 0.42), "translation": [-0.38, 0.36, 0.0], "color": [0.28, 0.32, 0.38, 1.0], "metallic": 0.80, "roughness": 0.38},
        {"name": "part_ball_joint", "geom": make_cylinder_mesh(0.12, 0.09, 0.22, 18, "y"), "translation": [0.08, 0.36, 0.0], "color": [0.16, 0.76, 0.52, 1.0], "metallic": 0.86, "roughness": 0.28},
        {"name": "part_steering_rack", "geom": make_cylinder_mesh(0.09, 0.09, 1.55, 20, "x"), "translation": [0.0, 0.52, 0.38], "color": [0.58, 0.64, 0.72, 1.0], "metallic": 0.88, "roughness": 0.26},
        {"name": "part_tie_rod", "geom": make_cylinder_mesh(0.05, 0.05, 0.68, 16, "x"), "translation": [0.58, 0.52, 0.38], "color": [0.92, 0.36, 0.28, 1.0], "metallic": 0.88, "roughness": 0.26},
    ]

    # 4. mech-turbo.glb
    mech_turbo_parts = [
        {"name": "part_air_intake", "geom": make_cylinder_mesh(0.28, 0.24, 0.62, 24, "x"), "translation": [-0.85, 0.92, 0.0], "color": [0.18, 0.58, 0.92, 1.0], "metallic": 0.78, "roughness": 0.28},
        {"name": "part_compressor_housing", "geom": make_torus_mesh(0.42, 0.18, 24, 18, "x"), "translation": [-0.36, 0.92, 0.0], "color": [0.78, 0.82, 0.88, 1.0], "metallic": 0.90, "roughness": 0.22},
        {"name": "part_chra_cartridge", "geom": make_cylinder_mesh(0.20, 0.20, 0.48, 24, "x"), "translation": [0.0, 0.92, 0.0], "color": [0.28, 0.34, 0.42, 1.0], "metallic": 0.88, "roughness": 0.26},
        {"name": "part_turbine_housing", "geom": make_torus_mesh(0.42, 0.18, 24, 18, "x"), "translation": [0.36, 0.92, 0.0], "color": [0.72, 0.36, 0.22, 1.0], "metallic": 0.84, "roughness": 0.36},
        {"name": "part_wastegate_actuator", "geom": make_cylinder_mesh(0.14, 0.14, 0.42, 18, "y"), "translation": [0.28, 1.42, 0.24], "color": [0.92, 0.68, 0.18, 1.0], "metallic": 0.86, "roughness": 0.25},
        {"name": "part_intercooler", "geom": make_box_mesh(1.35, 0.52, 0.22), "translation": [0.0, 0.38, 0.65], "color": [0.62, 0.68, 0.76, 1.0], "metallic": 0.88, "roughness": 0.28},
    ]

    # 5. mech-transmission.glb
    mech_transmission_parts = [
        {"name": "part_bell_housing", "geom": make_cylinder_mesh(0.56, 0.38, 0.52, 24, "x"), "translation": [-0.82, 0.82, 0.0], "color": [0.58, 0.62, 0.68, 1.0], "metallic": 0.85, "roughness": 0.32},
        {"name": "part_input_shaft", "geom": make_cylinder_mesh(0.14, 0.14, 0.85, 20, "x"), "translation": [-0.32, 0.82, 0.0], "color": [0.22, 0.64, 0.92, 1.0], "metallic": 0.90, "roughness": 0.22},
        {"name": "part_synchro_hub", "geom": make_torus_mesh(0.32, 0.10, 24, 16, "x"), "translation": [0.05, 0.82, 0.0], "color": [0.94, 0.66, 0.16, 1.0], "metallic": 0.88, "roughness": 0.24},
        {"name": "part_output_shaft", "geom": make_cylinder_mesh(0.16, 0.16, 0.88, 20, "x"), "translation": [0.48, 0.82, 0.0], "color": [0.18, 0.78, 0.54, 1.0], "metallic": 0.90, "roughness": 0.22},
        {"name": "part_differential", "geom": make_cylinder_mesh(0.38, 0.38, 0.44, 24, "z"), "translation": [0.72, 0.62, 0.28], "color": [0.46, 0.52, 0.60, 1.0], "metallic": 0.86, "roughness": 0.28},
        {"name": "part_gearbox_pan", "geom": make_box_mesh(1.38, 0.16, 0.78), "translation": [0.0, 0.24, 0.0], "color": [0.22, 0.26, 0.32, 1.0], "metallic": 0.82, "roughness": 0.36},
    ]

    # 6. hvac-chiller.glb (Unique industrial chiller assembly — distinct from mech-cylinder!)
    hvac_chiller_parts = [
        {"name": "part_scroll_compressor", "geom": make_cylinder_mesh(0.28, 0.28, 0.86, 24, "y"), "translation": [-0.72, 0.58, 0.24], "color": [0.14, 0.36, 0.78, 1.0], "metallic": 0.86, "roughness": 0.26},
        {"name": "part_evaporator_shell", "geom": make_cylinder_mesh(0.34, 0.34, 1.52, 24, "x"), "translation": [0.0, 0.46, -0.28], "color": [0.16, 0.68, 0.88, 1.0], "metallic": 0.84, "roughness": 0.28},
        {"name": "part_condenser_coil", "geom": make_box_mesh(1.62, 0.76, 0.32), "translation": [0.0, 1.08, 0.0], "color": [0.76, 0.46, 0.24, 1.0], "metallic": 0.88, "roughness": 0.30},
        {"name": "part_liquid_receiver", "geom": make_cylinder_mesh(0.18, 0.18, 0.68, 20, "y"), "translation": [0.74, 0.52, 0.28], "color": [0.18, 0.76, 0.52, 1.0], "metallic": 0.84, "roughness": 0.28},
        {"name": "part_expansion_valve_txv", "geom": make_cylinder_mesh(0.11, 0.11, 0.32, 16, "z"), "translation": [0.36, 0.76, 0.28], "color": [0.92, 0.72, 0.18, 1.0], "metallic": 0.90, "roughness": 0.22},
        {"name": "part_axial_fan_01", "geom": make_torus_mesh(0.32, 0.06, 24, 14, "y"), "translation": [-0.44, 1.52, 0.0], "color": [0.24, 0.28, 0.34, 1.0], "metallic": 0.80, "roughness": 0.32},
        {"name": "part_axial_fan_02", "geom": make_torus_mesh(0.32, 0.06, 24, 14, "y"), "translation": [0.44, 1.52, 0.0], "color": [0.24, 0.28, 0.34, 1.0], "metallic": 0.80, "roughness": 0.32},
    ]

    # 7. autoel-charging.glb (12V/24V Alternator & Starter Drive Assembly)
    autoel_charging_parts = [
        {"name": "part_stator_winding", "geom": make_torus_mesh(0.46, 0.14, 24, 16, "x"), "translation": [-0.32, 0.82, 0.0], "color": [0.84, 0.44, 0.18, 1.0], "metallic": 0.90, "roughness": 0.24},
        {"name": "part_rotor_armature", "geom": make_cylinder_mesh(0.26, 0.26, 0.96, 24, "x"), "translation": [0.0, 0.82, 0.0], "color": [0.72, 0.76, 0.82, 1.0], "metallic": 0.90, "roughness": 0.22},
        {"name": "part_rectifier_bridge", "geom": make_cylinder_mesh(0.38, 0.38, 0.14, 20, "x"), "translation": [-0.66, 0.82, 0.0], "color": [0.18, 0.62, 0.92, 1.0], "metallic": 0.84, "roughness": 0.28},
        {"name": "part_pwm_regulator", "geom": make_box_mesh(0.28, 0.34, 0.26), "translation": [-0.78, 1.02, 0.18], "color": [0.18, 0.78, 0.52, 1.0], "metallic": 0.76, "roughness": 0.30},
        {"name": "part_planetary_gear", "geom": make_cylinder_mesh(0.32, 0.32, 0.36, 24, "x"), "translation": [0.58, 0.82, 0.0], "color": [0.92, 0.68, 0.18, 1.0], "metallic": 0.88, "roughness": 0.24},
        {"name": "part_housing_ground", "geom": make_box_mesh(1.48, 0.18, 0.82), "translation": [0.0, 0.22, 0.0], "color": [0.28, 0.32, 0.38, 1.0], "metallic": 0.82, "roughness": 0.36},
    ]

    targets = [
        ("mech-cylinder.glb", mech_cylinder_parts, "AMK-SkillHub 3.0 Mech-Cylinder Reference Bay"),
        ("mech-brakes.glb", mech_brakes_parts, "AMK-SkillHub 3.0 Mech-Brakes Bay"),
        ("mech-suspension.glb", mech_suspension_parts, "AMK-SkillHub 3.0 Mech-Suspension Bay"),
        ("mech-turbo.glb", mech_turbo_parts, "AMK-SkillHub 3.0 Mech-Turbo Bay"),
        ("mech-transmission.glb", mech_transmission_parts, "AMK-SkillHub 3.0 Mech-Transmission Bay"),
        ("hvac-chiller.glb", hvac_chiller_parts, "AMK-SkillHub 3.0 HVAC-Chiller Assembly"),
        ("autoel-charging.glb", autoel_charging_parts, "AMK-SkillHub 3.0 Autoel-Charging Assembly"),
    ]

    for fname, spec, tag in targets:
        out_path = os.path.join(MODELS_DIR, fname)
        glb_data = build_glb_bytes(spec, tag)
        with open(out_path, "wb") as f:
            f.write(glb_data)
        sha = hashlib.sha256(glb_data).hexdigest()[:16].upper()
        print(f"Wrote {fname:24s} {len(glb_data):8d} B  SHA256={sha}  nodes={len(spec)}")

    # Verify all 25 GLBs have unique SHA-256 hashes and <= 2 MB
    all_glbs = sorted(glob.glob(os.path.join(MODELS_DIR, "*.glb")))
    hashes = set()
    total_bytes = 0
    for p in all_glbs:
        d = open(p, "rb").read()
        total_bytes += len(d)
        hashes.add(hashlib.sha256(d).hexdigest())
    print(f"Total GLBs: {len(all_glbs)}, Unique SHA-256 hashes: {len(hashes)}, Total bytes: {total_bytes} ({total_bytes / (1024*1024):.2f} MB)")


if __name__ == "__main__":
    build_all()
