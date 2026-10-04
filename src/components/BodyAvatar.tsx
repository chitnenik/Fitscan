"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STATUS_COLOR } from "@/lib/colors";
import type { FitStatus, Measurements, Zone } from "@/lib/types";


interface Props {
  measurements: Measurements;
  zones?: Partial<Record<Zone, FitStatus>>;
  heatmap?: boolean;
  autoRotate?: boolean;
  className?: string;
}

/** Ellipse semi-axis (m) for a body circumference (cm), assuming depth = 0.7 × width. */
const semiAxis = (circCm: number) => circCm / 100 / (Math.PI * 1.7);

interface BodyLayout {
  crotchY: number;
  zoneBands: { zone: Zone; from: number; to: number }[];
  ringY: Record<Zone, number>;
  ringR: Record<Zone, number>;
  shoulderX: number;
  shoulderY: number;
  hipA: number;
}

function layoutFor(m: Measurements): BodyLayout {
  const crotchY = m.inseam / 100;
  const hipsY = crotchY + 0.1;
  const waistY = crotchY + 0.28;
  const chestY = crotchY + 0.47;
  const shoulderY = crotchY + 0.63;
  return {
    crotchY,
    shoulderX: m.shoulder / 200,
    shoulderY,
    hipA: semiAxis(m.hips),
    zoneBands: [
      { zone: "hips", from: crotchY - 0.05, to: (hipsY + waistY) / 2 },
      { zone: "waist", from: (hipsY + waistY) / 2, to: (waistY + chestY) / 2 },
      { zone: "chest", from: (waistY + chestY) / 2, to: chestY + 0.09 },
      { zone: "shoulders", from: chestY + 0.09, to: shoulderY + 0.12 },
    ],
    ringY: { hips: hipsY, waist: waistY, chest: chestY, shoulders: shoulderY - 0.02, inseam: crotchY * 0.1 },
    ringR: {
      hips: semiAxis(m.hips),
      waist: semiAxis(m.waist),
      chest: semiAxis(m.chest),
      shoulders: m.shoulder / 200,
      inseam: 0.06,
    },
  };
}

function torsoGeometry(m: Measurements, L: BodyLayout) {
  const c = L.crotchY;
  const hipA = semiAxis(m.hips);
  const waistA = semiAxis(m.waist);
  const chestA = semiAxis(m.chest);
  const sh = m.shoulder / 200;
  const pts = [
    new THREE.Vector2(0.001, c - 0.06),
    new THREE.Vector2(hipA * 0.7, c - 0.03),
    new THREE.Vector2(hipA * 0.95, c + 0.04),
    new THREE.Vector2(hipA, c + 0.1),
    new THREE.Vector2((hipA + waistA) / 2, c + 0.19),
    new THREE.Vector2(waistA, c + 0.28),
    new THREE.Vector2((waistA + chestA) / 2, c + 0.38),
    new THREE.Vector2(chestA, c + 0.47),
    new THREE.Vector2(chestA * 0.97, c + 0.54),
    new THREE.Vector2(sh * 0.85, c + 0.61),
    new THREE.Vector2(sh * 0.55, c + 0.66),
    new THREE.Vector2(0.06, c + 0.69),
    new THREE.Vector2(0.055, c + 0.76),
    new THREE.Vector2(0.001, c + 0.77),
  ];
  const curve = new THREE.SplineCurve(pts);
  const geo = new THREE.LatheGeometry(curve.getPoints(80), 48);
  geo.scale(1, 1, 0.7);
  return geo;
}

function legGeometry(m: Measurements, L: BodyLayout) {
  const c = L.crotchY;
  const thigh = L.hipA * 0.5;
  const pts = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.04, 0.01),
    new THREE.Vector2(0.038, 0.08),
    new THREE.Vector2(0.05, c * 0.3),
    new THREE.Vector2(0.046, c * 0.5),
    new THREE.Vector2(thigh * 0.8, c * 0.75),
    new THREE.Vector2(thigh, c * 0.95),
    new THREE.Vector2(thigh * 0.9, c + 0.04),
    new THREE.Vector2(0.001, c + 0.05),
  ];
  return new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(40), 24);
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Paints per-vertex heat-map colours, blending softly across zone boundaries. */
function paint(
  geo: THREE.BufferGeometry,
  colorAt: (y: number) => THREE.Color,
  yOffset = 0,
) {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const c = colorAt(pos.getY(i) + yOffset);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

export default function BodyAvatar({ measurements, zones = {}, heatmap = true, autoRotate = true, className }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const zonesKey = JSON.stringify(zones);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const zoneMap = JSON.parse(zonesKey) as Partial<Record<Zone, FitStatus>>;

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 360;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 50);
    const L = layoutFor(measurements);
    const midY = (L.shoulderY + 0.25) / 2;
    camera.position.set(0.6, midY + 0.15, 3.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, midY, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 5;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.6;

    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 3, 2);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x67e8f9, 1.2);
    rim.position.set(-2, 2, -2);
    scene.add(rim);

    const neutral = new THREE.Color(STATUS_COLOR.neutral);
    const zoneColor = (z: Zone) => {
      const s = zoneMap[z];
      return heatmap && s ? new THREE.Color(STATUS_COLOR[s]) : neutral.clone();
    };
    const torsoColorAt = (y: number) => {
      let col = neutral.clone();
      L.zoneBands.forEach((b, i) => {
        const w = i === 0 ? 1 : smooth(b.from - 0.03, b.from + 0.03, y);
        if (w > 0) col = col.lerp(zoneColor(b.zone), w);
      });
      const top = L.zoneBands[L.zoneBands.length - 1].to;
      return col.lerp(neutral, smooth(top, top + 0.06, y));
    };

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.45,
      metalness: 0.1,
      transparent: true,
      opacity: 0.94,
    });
    const wireMat = new THREE.LineBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.12 });
    const body = new THREE.Group();
    const disposables: { dispose: () => void }[] = [material, wireMat];

    const addMesh = (geo: THREE.BufferGeometry, pos: [number, number, number], rotZ = 0) => {
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(...pos);
      mesh.rotation.z = rotZ;
      const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireMat);
      mesh.add(wire);
      body.add(mesh);
      disposables.push(geo, wire.geometry);
      return mesh;
    };

    // Torso + neck
    const torso = torsoGeometry(measurements, L);
    paint(torso, torsoColorAt);
    addMesh(torso, [0, 0, 0]);

    // Legs (inseam zone; hips colour bleeds into the upper thigh)
    const legX = L.hipA * 0.48;
    for (const side of [-1, 1]) {
      const leg = legGeometry(measurements, L);
      paint(leg, (y) => {
        const base = zoneColor("inseam");
        const hips = zoneMap.hips ? zoneColor("hips") : base;
        return base.clone().lerp(hips, smooth(L.crotchY - 0.2, L.crotchY, y));
      });
      addMesh(leg, [side * legX, 0, 0]);
    }

    // Arms (hang in a relaxed A-pose; upper arm takes the shoulder colour)
    const armLen = 0.58;
    for (const side of [-1, 1]) {
      const arm = new THREE.CapsuleGeometry(0.04, armLen, 6, 16);
      arm.translate(0, -armLen / 2, 0);
      paint(arm, (y) =>
        neutral.clone().lerp(zoneColor("shoulders"), smooth(-0.22, -0.02, y)),
      );
      addMesh(arm, [side * (L.shoulderX + 0.01), L.shoulderY - 0.02, 0], side * 0.16);
    }

    // Head
    const head = new THREE.SphereGeometry(0.1, 32, 24);
    head.scale(0.9, 1.15, 1);
    paint(head, () => neutral);
    addMesh(head, [0, L.crotchY + 0.86, 0]);

    // Pinch / gap rings
    const rings: THREE.Mesh[] = [];
    if (heatmap) {
      (Object.keys(zoneMap) as Zone[]).forEach((z) => {
        const s = zoneMap[z];
        if (s !== "tight" && s !== "loose") return;
        const r = L.ringR[z] * (s === "tight" ? 1.02 : 1.22);
        const make = (x: number) => {
          const g = new THREE.TorusGeometry(z === "inseam" ? 0.06 : r, 0.008, 8, 64);
          const m = new THREE.MeshBasicMaterial({ color: STATUS_COLOR[s], transparent: true, opacity: 0.9 });
          const ring = new THREE.Mesh(g, m);
          ring.rotation.x = Math.PI / 2;
          ring.scale.set(1, z === "inseam" ? 1 : 0.72, 1);
          ring.position.set(x, L.ringY[z], 0);
          ring.userData.status = s;
          ring.userData.squash = z === "inseam" ? 1 : 0.72;
          body.add(ring);
          rings.push(ring);
          disposables.push(g, m);
        };
        if (z === "inseam") [-legX, legX].forEach(make);
        else make(0);
      });
    }

    // Floor scan disc
    const disc = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.37, 64),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
    );
    disc.rotation.x = -Math.PI / 2;
    disposables.push(disc.geometry, disc.material as THREE.Material);
    scene.add(disc);
    const grid = new THREE.PolarGridHelper(0.9, 12, 6, 64, 0x155e75, 0x0e3a4a);
    scene.add(grid);
    scene.add(body);

    let frame = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      const t = clock.getElapsedTime();
      rings.forEach((ring) => {
        const pulse = ring.userData.status === "tight" ? 1 + Math.sin(t * 5) * 0.04 : 1 + Math.sin(t * 2) * 0.02;
        ring.scale.x = pulse;
        ring.scale.y = pulse * ring.userData.squash;
      });
      disc.scale.setScalar(1 + (t % 2) * 0.6);
      (disc.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - (t % 2) / 2);
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    tick();

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      grid.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [measurements, zonesKey, heatmap, autoRotate]);

  return <div ref={mountRef} className={className ?? "h-80 w-full"} />;
}
