import * as THREE from 'three';
import {
  FLOOR_MATERIAL_CONFIG,
  FURNITURE_CATALOG,
  WALL_STYLE_CONFIG,
} from '../presets';
import {
  FloorMaterial,
  FurnitureItem,
  OfficeAgent,
  Point2D,
  WallFeature,
  WallStyle,
} from '../types';

const textureCache = new Map<FloorMaterial, THREE.CanvasTexture>();

export function createFloorTexture(material: FloorMaterial): THREE.CanvasTexture {
  const cached = textureCache.get(material);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cfg = FLOOR_MATERIAL_CONFIG[material];

  ctx.fillStyle = cfg.baseColor;
  ctx.fillRect(0, 0, 512, 512);

  if (material === 'warm_oak') {
    // Wood planks with subtle grain and joints
    const plankH = 64;
    for (let y = 0; y < 512; y += plankH) {
      const row = y / plankH;
      const offset = (row % 2) * 128;
      ctx.fillStyle = row % 2 === 0 ? cfg.baseColor : '#c39e70';
      ctx.fillRect(0, y, 512, plankH);

      // Grain lines
      ctx.strokeStyle = 'rgba(92, 64, 51, 0.12)';
      ctx.lineWidth = 1;
      for (let g = 4; g < plankH; g += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y + g);
        ctx.lineTo(512, y + g + ((g % 3) - 1) * 2);
        ctx.stroke();
      }

      // Plank seams
      ctx.strokeStyle = 'rgba(60, 40, 25, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      for (let x = offset; x < 512; x += 256) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + plankH);
        ctx.stroke();
      }
    }
  } else if (material === 'herringbone_walnut') {
    // Rich dark walnut chevron/herringbone pattern
    const step = 64;
    ctx.strokeStyle = 'rgba(30, 18, 10, 0.35)';
    ctx.lineWidth = 2;
    for (let y = -step; y < 512 + step; y += step) {
      for (let x = -step; x < 512 + step; x += step) {
        const isEven = ((x + y) / step) % 2 === 0;
        ctx.fillStyle = isEven ? cfg.baseColor : cfg.secondaryColor;
        ctx.fillRect(x, y, step, step);
        ctx.strokeRect(x, y, step, step);
        // Diagonal subtle wood grain
        ctx.strokeStyle = 'rgba(255, 230, 200, 0.06)';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step, y + step);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(30, 18, 10, 0.35)';
      }
    }
  } else if (material === 'polished_concrete') {
    // Subtle troweled concrete speckles and expansion joints
    for (let i = 0; i < 1800; i++) {
      const rx = (i * 73) % 512;
      const ry = (i * 137) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.05)';
      ctx.fillRect(rx, ry, 4, 4);
    }
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.22)';
    ctx.lineWidth = 2;
    for (let p = 0; p < 512; p += 256) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }
  } else if (material === 'architectural_tile') {
    const tile = 128;
    for (let y = 0; y < 512; y += tile) {
      for (let x = 0; x < 512; x += tile) {
        ctx.fillStyle = (x / tile + y / tile) % 2 === 0 ? cfg.baseColor : '#4f5e73';
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
      }
    }
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    for (let p = 0; p <= 512; p += tile) {
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }
  } else if (material === 'charcoal_carpet') {
    // Acoustic woven carpet tile texture
    for (let y = 0; y < 512; y += 4) {
      for (let x = 0; x < 512; x += 4) {
        ctx.fillStyle = (x + y) % 8 === 0 ? cfg.baseColor : cfg.secondaryColor;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  } else if (material === 'terrazzo') {
    // Mineral terrazzo aggregate chips
    const chipColors = ['#64748b', '#94a3b8', '#b45309', '#475569', '#f8fafc'];
    for (let i = 0; i < 650; i++) {
      const x = (i * 97) % 512;
      const y = (i * 193) % 512;
      const r = 2 + (i % 6);
      ctx.fillStyle = chipColors[i % chipColors.length];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.35, 0.35);
  texture.needsUpdate = true;
  textureCache.set(material, texture);
  return texture;
}

export interface WallSegmentRecord {
  group: THREE.Group;
  edgeIndex: number;
  midX: number;
  midZ: number;
  normalX: number;
  normalZ: number;
  fullHeight: number;
}

export function buildRoomArchitecture(
  vertices: Point2D[],
  wallHeight: number,
  floorMaterial: FloorMaterial,
  wallStyle: WallStyle,
  wallFeatures: WallFeature[]
): {
  roomGroup: THREE.Group;
  floorMesh: THREE.Mesh;
  wallSegments: WallSegmentRecord[];
} {
  const roomGroup = new THREE.Group();
  const wallSegments: WallSegmentRecord[] = [];

  if (vertices.length < 3) {
    const fallbackFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0x64748b })
    );
    fallbackFloor.rotation.x = -Math.PI / 2;
    roomGroup.add(fallbackFloor);
    return { roomGroup, floorMesh: fallbackFloor, wallSegments };
  }

  // Compute signed area to determine winding order so wall normals point inward
  let signedArea = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    signedArea += vertices[i].x * vertices[j].z - vertices[j].x * vertices[i].z;
  }
  const windingSign = signedArea >= 0 ? 1 : -1;

  // 1. Build extruded 3D Floor Slab from 2D polygon
  // Note: THREE.Shape is in (x, y). When rotated by -PI/2 around X, local Y maps to -Z.
  // So we pass (v.x, -v.z) into THREE.Shape so after rotation X=-PI/2 it maps to (v.x, 0, v.z)!
  const shape = new THREE.Shape();
  shape.moveTo(vertices[0].x, -vertices[0].z);
  for (let i = 1; i < vertices.length; i++) {
    shape.lineTo(vertices[i].x, -vertices[i].z);
  }
  shape.closePath();

  const floorConfig = FLOOR_MATERIAL_CONFIG[floorMaterial];
  const floorTex = createFloorTexture(floorMaterial);

  const slabDepth = 0.18;
  const floorGeo = new THREE.ExtrudeGeometry(shape, {
    depth: slabDepth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });

  const topFloorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: floorConfig.roughness,
    metalness: floorConfig.metalness,
  });
  const sideSlabMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.7,
    metalness: 0.1,
  });

  const floorMesh = new THREE.Mesh(floorGeo, [topFloorMat, sideSlabMat]);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -slabDepth; // So top surface sits cleanly at y = 0
  floorMesh.receiveShadow = true;
  floorMesh.name = 'office-floor-slab';
  roomGroup.add(floorMesh);

  // Subtle floor grid overlay lines on top of the floor polygon
  const wallCfg = WALL_STYLE_CONFIG[wallStyle];
  const wallMat = new THREE.MeshStandardMaterial({
    color: wallCfg.color,
    roughness: 0.72,
    metalness: 0.05,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: wallCfg.trimColor,
    roughness: 0.5,
    metalness: 0.15,
  });
  const glassPaneMat = new THREE.MeshPhysicalMaterial({
    color: '#bae6fd',
    transparent: true,
    opacity: 0.34,
    roughness: 0.08,
    metalness: 0.1,
    transmission: 0.5,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.35,
    metalness: 0.6,
  });

  const wallThickness = 0.16;

  // 2. Build perimeter 3D walls along each polygon edge
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const dx = v2.x - v1.x;
    const dz = v2.z - v1.z;
    const segLength = Math.hypot(dx, dz);
    if (segLength < 0.05) continue;

    const midX = (v1.x + v2.x) / 2;
    const midZ = (v1.z + v2.z) / 2;
    const angle = Math.atan2(dz, dx);

    // Outward normal of edge
    const normalX = (dz / segLength) * windingSign;
    const normalZ = (-dx / segLength) * windingSign;

    const segGroup = new THREE.Group();
    segGroup.position.set(midX, 0, midZ);
    segGroup.rotation.y = -angle;

    // Check if there are wall features (windows, doors, glass_wall, opening) on this edge
    const edgeFeatures = wallFeatures.filter((wf) => wf.edgeIndex === i);

    const hasGlassWall = edgeFeatures.some((wf) => wf.type === 'glass_wall');
    const openingFeat = edgeFeatures.find((wf) => wf.type === 'opening');

    if (hasGlassWall) {
      // Architectural floor-to-ceiling curtain glass wall with mullions
      const sillH = 0.12;
      const headerH = 0.16;
      const glassH = Math.max(0.5, wallHeight - sillH - headerH);

      const sill = new THREE.Mesh(
        new THREE.BoxGeometry(segLength + wallThickness, sillH, wallThickness),
        frameMat
      );
      sill.position.y = sillH / 2;
      sill.castShadow = true;
      sill.receiveShadow = true;
      segGroup.add(sill);

      const header = new THREE.Mesh(
        new THREE.BoxGeometry(segLength + wallThickness, headerH, wallThickness),
        frameMat
      );
      header.position.y = wallHeight - headerH / 2;
      header.castShadow = true;
      segGroup.add(header);

      const glassPane = new THREE.Mesh(
        new THREE.BoxGeometry(segLength, glassH, 0.04),
        glassPaneMat
      );
      glassPane.position.y = sillH + glassH / 2;
      segGroup.add(glassPane);

      // Vertical mullions every ~1.5m
      const mullionCount = Math.max(2, Math.floor(segLength / 1.5));
      for (let m = 0; m <= mullionCount; m++) {
        const mx = -segLength / 2 + (m / mullionCount) * segLength;
        const mullion = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, wallHeight, wallThickness * 0.9),
          frameMat
        );
        mullion.position.set(mx, wallHeight / 2, 0);
        mullion.castShadow = true;
        segGroup.add(mullion);
      }
    } else if (openingFeat) {
      // Deleted portion of the wall / Wall Opening / Archway
      const openWidth = Math.min(openingFeat.width, segLength);

      if (openWidth >= segLength * 0.9) {
        // Entire wall portion is open / deleted! Floor threshold trim line
        const threshold = new THREE.Mesh(
          new THREE.BoxGeometry(segLength, 0.02, wallThickness * 0.75),
          trimMat
        );
        threshold.position.y = 0.01;
        segGroup.add(threshold);
      } else {
        const localX = (openingFeat.offsetRatio - 0.5) * segLength;
        const openStart = localX - openWidth / 2;
        const openEnd = localX + openWidth / 2;
        const segStart = -segLength / 2;
        const segEnd = segLength / 2;

        const leftWidth = Math.max(0, openStart - segStart);
        const rightWidth = Math.max(0, segEnd - openEnd);

        if (leftWidth > 0.06) {
          const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(leftWidth, wallHeight, wallThickness),
            wallMat.clone()
          );
          leftWall.position.set(segStart + leftWidth / 2, wallHeight / 2, 0);
          leftWall.castShadow = true;
          leftWall.receiveShadow = true;
          segGroup.add(leftWall);

          const leftBase = new THREE.Mesh(
            new THREE.BoxGeometry(leftWidth + 0.02, 0.1, wallThickness + 0.02),
            trimMat
          );
          leftBase.position.set(segStart + leftWidth / 2, 0.05, 0);
          segGroup.add(leftBase);
        }

        if (rightWidth > 0.06) {
          const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(rightWidth, wallHeight, wallThickness),
            wallMat.clone()
          );
          rightWall.position.set(openEnd + rightWidth / 2, wallHeight / 2, 0);
          rightWall.castShadow = true;
          rightWall.receiveShadow = true;
          segGroup.add(rightWall);

          const rightBase = new THREE.Mesh(
            new THREE.BoxGeometry(rightWidth + 0.02, 0.1, wallThickness + 0.02),
            trimMat
          );
          rightBase.position.set(openEnd + rightWidth / 2, 0.05, 0);
          segGroup.add(rightBase);
        }

        // Top architectural header above walkthrough opening
        const headerH = Math.max(0.18, wallHeight - 2.2);
        if (headerH > 0.12) {
          const header = new THREE.Mesh(
            new THREE.BoxGeometry(openWidth + 0.02, headerH, wallThickness),
            wallMat.clone()
          );
          header.position.set(localX, wallHeight - headerH / 2, 0);
          header.castShadow = true;
          segGroup.add(header);
        }
      }
    } else {
      // Solid architectural wall segment
      const mainWall = new THREE.Mesh(
        new THREE.BoxGeometry(segLength + wallThickness * 0.8, wallHeight, wallThickness),
        wallMat.clone()
      );
      mainWall.position.y = wallHeight / 2;
      mainWall.castShadow = true;
      mainWall.receiveShadow = true;
      segGroup.add(mainWall);

      // Baseboard trim
      const baseboard = new THREE.Mesh(
        new THREE.BoxGeometry(segLength + wallThickness * 0.85, 0.1, wallThickness + 0.02),
        trimMat
      );
      baseboard.position.y = 0.05;
      segGroup.add(baseboard);

      // Top cap trim
      const topCap = new THREE.Mesh(
        new THREE.BoxGeometry(segLength + wallThickness * 0.85, 0.06, wallThickness + 0.02),
        trimMat
      );
      topCap.position.y = wallHeight - 0.03;
      segGroup.add(topCap);

      // Add embedded architectural windows or doors along this wall segment
      for (const feat of edgeFeatures) {
        const localX = (feat.offsetRatio - 0.5) * segLength;
        const clampedWidth = Math.min(feat.width, segLength * 0.75);

        if (feat.type === 'window') {
          const winH = Math.min(1.5, wallHeight * 0.5);
          const winY = wallHeight * 0.52;
          const winGroup = new THREE.Group();
          winGroup.position.set(localX, winY, 0);

          // Window frame
          const frameBox = new THREE.Mesh(
            new THREE.BoxGeometry(clampedWidth + 0.08, winH + 0.08, wallThickness + 0.04),
            frameMat
          );
          winGroup.add(frameBox);

          // Glass insert
          const glassInsert = new THREE.Mesh(
            new THREE.BoxGeometry(clampedWidth, winH, wallThickness + 0.06),
            new THREE.MeshPhysicalMaterial({
              color: '#7dd3fc',
              roughness: 0.1,
              metalness: 0.2,
              transparent: true,
              opacity: 0.75,
            })
          );
          winGroup.add(glassInsert);

          // Center mullion bar
          const centerMullion = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, winH, wallThickness + 0.07),
            frameMat
          );
          winGroup.add(centerMullion);

          segGroup.add(winGroup);
        } else if (feat.type === 'door') {
          const doorH = Math.min(2.2, wallHeight - 0.25);
          const doorW = Math.min(clampedWidth, 1.5);
          const doorGroup = new THREE.Group();
          doorGroup.position.set(localX, doorH / 2, 0);

          const doorFrame = new THREE.Mesh(
            new THREE.BoxGeometry(doorW + 0.12, doorH + 0.06, wallThickness + 0.04),
            frameMat
          );
          doorGroup.add(doorFrame);

          const doorLeaf = new THREE.Mesh(
            new THREE.BoxGeometry(doorW, doorH - 0.04, wallThickness + 0.05),
            new THREE.MeshStandardMaterial({
              color: '#5c4033',
              roughness: 0.45,
              metalness: 0.1,
            })
          );
          doorGroup.add(doorLeaf);

          // Door glass vision panel
          const visionPanel = new THREE.Mesh(
            new THREE.BoxGeometry(doorW * 0.32, doorH * 0.65, wallThickness + 0.065),
            glassPaneMat
          );
          visionPanel.position.set(doorW * 0.15, 0.1, 0);
          doorGroup.add(visionPanel);

          // Door handle
          const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.03, wallThickness + 0.12),
            new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8, roughness: 0.2 })
          );
          handle.position.set(doorW * 0.38, -0.08, 0);
          doorGroup.add(handle);

          segGroup.add(doorGroup);
        }
      }
    }

    roomGroup.add(segGroup);
    wallSegments.push({
      group: segGroup,
      edgeIndex: i,
      midX,
      midZ,
      normalX,
      normalZ,
      fullHeight: wallHeight,
    });
  }

  return { roomGroup, floorMesh, wallSegments };
}

// Helper to create common chair sub-assembly
function createChairSubMesh(primaryColor: string, accentColor: string): THREE.Group {
  const chair = new THREE.Group();
  const seatMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    roughness: 0.6,
    metalness: 0.1,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.35,
    metalness: 0.7,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Base pedestal
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 12), metalMat);
  column.position.y = 0.22;
  chair.add(column);

  // 5-star legs
  for (let i = 0; i < 5; i++) {
    const legAngle = (i * Math.PI * 2) / 5;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.035), metalMat);
    leg.position.set(Math.cos(legAngle) * 0.13, 0.04, Math.sin(legAngle) * 0.13);
    leg.rotation.y = -legAngle;
    chair.add(leg);
  }

  // Seat cushion
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.46), seatMat);
  seat.position.y = 0.45;
  seat.castShadow = true;
  chair.add(seat);

  // Backrest
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.46, 0.05), seatMat);
  back.position.set(0, 0.72, -0.21);
  back.rotation.x = -0.08;
  back.castShadow = true;
  chair.add(back);

  // Lumbar accent bar
  const lumbar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.06), accentMat);
  lumbar.position.set(0, 0.62, -0.22);
  chair.add(lumbar);

  return chair;
}

// Helper to create monitor + stand sub-assembly
function createMonitorSubMesh(width = 0.62, curved = false): THREE.Group {
  const mon = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.3,
    metalness: 0.6,
  });
  const screenMat = new THREE.MeshStandardMaterial({
    color: '#0284c7',
    emissive: '#0369a1',
    emissiveIntensity: 0.35,
    roughness: 0.15,
    metalness: 0.2,
  });

  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.015, 0.16), frameMat);
  standBase.position.y = 0.008;
  mon.add(standBase);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.18, 10), frameMat);
  neck.position.set(0, 0.09, -0.04);
  mon.add(neck);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(width, 0.34, 0.025), frameMat);
  panel.position.set(0, 0.28, 0);
  panel.castShadow = true;
  mon.add(panel);

  const display = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.03, 0.31), screenMat);
  display.position.set(0, 0.28, 0.014);
  if (curved) {
    display.scale.x = 1.02;
  }
  mon.add(display);

  return mon;
}

export function buildFurniture3DModel(
  item: FurnitureItem,
  isSelected: boolean,
  isHovered: boolean
): THREE.Group {
  const root = new THREE.Group();
  root.name = `furniture-${item.id}`;
  root.userData = { furnitureId: item.id, furnitureType: item.type };

  const catEntry =
    FURNITURE_CATALOG.find((c) => c.type === item.type) || FURNITURE_CATALOG[0];

  const primaryMat = new THREE.MeshStandardMaterial({
    color: item.primaryColor || catEntry.defaultPrimaryColor,
    roughness: 0.48,
    metalness: 0.12,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: item.accentColor || catEntry.defaultAccentColor,
    roughness: 0.42,
    metalness: 0.25,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.35,
    metalness: 0.7,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    roughness: 0.2,
    metalness: 0.85,
  });

  switch (item.type) {
    case 'executive_desk': {
      // Main desk surface
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.055, 0.9), primaryMat);
      top.position.set(0, 0.74, -0.32);
      top.castShadow = true;
      top.receiveShadow = true;
      root.add(top);

      // L-return side credenza
      const sideReturn = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.68, 1.55), primaryMat);
      sideReturn.position.set(-0.72, 0.34, 0.02);
      sideReturn.castShadow = true;
      sideReturn.receiveShadow = true;
      root.add(sideReturn);

      // Modesty panel & right slab leg
      const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, 0.86), accentMat);
      rightPanel.position.set(0.98, 0.36, -0.32);
      rightPanel.castShadow = true;
      root.add(rightPanel);

      const frontModesty = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.48, 0.04), accentMat);
      frontModesty.position.set(0.05, 0.45, -0.72);
      root.add(frontModesty);

      // Dual monitors on main desk
      const mon1 = createMonitorSubMesh(0.65, true);
      mon1.position.set(0.05, 0.77, -0.52);
      mon1.rotation.y = -0.15;
      root.add(mon1);

      const mon2 = createMonitorSubMesh(0.65, true);
      mon2.position.set(0.68, 0.77, -0.45);
      mon2.rotation.y = -0.45;
      root.add(mon2);

      // Executive chair
      const chair = createChairSubMesh(item.accentColor, item.primaryColor);
      chair.position.set(0.28, 0, 0.32);
      chair.rotation.y = Math.PI;
      root.add(chair);
      break;
    }

    case 'standing_desk': {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.045, 0.8), primaryMat);
      top.position.set(0, 0.75, 0);
      top.castShadow = true;
      top.receiveShadow = true;
      root.add(top);

      // Dual motorized T-legs
      for (const lx of [-0.68, 0.68]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.08), darkMetalMat);
        post.position.set(lx, 0.36, 0);
        post.castShadow = true;
        root.add(post);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.68), darkMetalMat);
        foot.position.set(lx, 0.015, 0);
        root.add(foot);
      }

      // Ultrawide monitor + keyboard
      const mon = createMonitorSubMesh(0.76, true);
      mon.position.set(0, 0.77, -0.22);
      root.add(mon);

      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.13), darkMetalMat);
      kb.position.set(0, 0.78, 0.12);
      root.add(kb);

      // Task chair tucked slightly in front
      const chair = createChairSubMesh(item.accentColor, '#38bdf8');
      chair.position.set(0, 0, 0.56);
      chair.rotation.y = Math.PI;
      root.add(chair);
      break;
    }

    case 'quad_workbench': {
      // 4-person bench top
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.05, 1.55), primaryMat);
      top.position.set(0, 0.74, 0);
      top.castShadow = true;
      top.receiveShadow = true;
      root.add(top);

      // Central acoustic felt privacy divider
      const screen = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.42, 0.045), accentMat);
      screen.position.set(0, 0.96, 0);
      screen.castShadow = true;
      root.add(screen);

      // Frame legs
      for (const lx of [-1.45, 0, 1.45]) {
        for (const lz of [-0.68, 0.68]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.73, 0.06), darkMetalMat);
          leg.position.set(lx, 0.365, lz);
          root.add(leg);
        }
      }

      // 4 workstations (2 per side)
      for (const sx of [-0.78, 0.78]) {
        // North side
        const monN = createMonitorSubMesh(0.6, false);
        monN.position.set(sx, 0.765, -0.18);
        monN.rotation.y = Math.PI;
        root.add(monN);

        const chairN = createChairSubMesh('#1e293b', item.accentColor);
        chairN.position.set(sx, 0, -0.95);
        chairN.rotation.y = 0;
        root.add(chairN);

        // South side
        const monS = createMonitorSubMesh(0.6, false);
        monS.position.set(sx, 0.765, 0.18);
        monS.rotation.y = 0;
        root.add(monS);

        const chairS = createChairSubMesh('#1e293b', item.accentColor);
        chairS.position.set(sx, 0, 0.95);
        chairS.rotation.y = Math.PI;
        root.add(chairS);
      }
      break;
    }

    case 'conference_table': {
      // Boardroom tabletop
      const top = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 1.32), primaryMat);
      top.position.set(0, 0.74, 0);
      top.castShadow = true;
      top.receiveShadow = true;
      root.add(top);

      // Center power/AV trough
      const trough = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.065, 0.18), darkMetalMat);
      trough.position.set(0, 0.742, 0);
      root.add(trough);

      // Two architectural slab pedestals
      for (const px of [-1.05, 1.05]) {
        const ped = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.75), darkMetalMat);
        ped.position.set(px, 0.36, 0);
        ped.castShadow = true;
        root.add(ped);
      }

      // 8 chairs around the perimeter (3 each side + 2 heads)
      for (const cx of [-1.05, 0, 1.05]) {
        const cNorth = createChairSubMesh(item.accentColor, item.primaryColor);
        cNorth.position.set(cx, 0, -0.86);
        cNorth.rotation.y = 0;
        root.add(cNorth);

        const cSouth = createChairSubMesh(item.accentColor, item.primaryColor);
        cSouth.position.set(cx, 0, 0.86);
        cSouth.rotation.y = Math.PI;
        root.add(cSouth);
      }
      const cWest = createChairSubMesh(item.accentColor, item.primaryColor);
      cWest.position.set(-1.92, 0, 0);
      cWest.rotation.y = Math.PI / 2;
      root.add(cWest);

      const cEast = createChairSubMesh(item.accentColor, item.primaryColor);
      cEast.position.set(1.92, 0, 0);
      cEast.rotation.y = -Math.PI / 2;
      root.add(cEast);
      break;
    }

    case 'round_meeting_table': {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.045, 32), primaryMat);
      top.position.y = 0.74;
      top.castShadow = true;
      top.receiveShadow = true;
      root.add(top);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.72, 16), darkMetalMat);
      post.position.y = 0.36;
      post.castShadow = true;
      root.add(post);

      const basePlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.4, 0.025, 24),
        darkMetalMat
      );
      basePlate.position.y = 0.015;
      root.add(basePlate);

      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const ch = createChairSubMesh(item.accentColor, item.primaryColor);
        ch.position.set(Math.cos(ang) * 0.88, 0, Math.sin(ang) * 0.88);
        ch.rotation.y = -ang + Math.PI / 2;
        root.add(ch);
      }
      break;
    }

    case 'ergonomic_chair': {
      const ch = createChairSubMesh(item.primaryColor, item.accentColor);
      root.add(ch);
      break;
    }

    case 'lounge_sofa': {
      // 3-seater base platform
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.24, 0.9), primaryMat);
      base.position.set(0, 0.18, 0);
      base.castShadow = true;
      base.receiveShadow = true;
      root.add(base);

      // 3 seat cushions
      for (const sx of [-0.7, 0, 0.7]) {
        const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.78), primaryMat);
        cushion.position.set(sx, 0.36, 0.04);
        cushion.castShadow = true;
        root.add(cushion);
      }

      // Backrest & armrests
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.48, 0.2), primaryMat);
      backrest.position.set(0, 0.54, -0.35);
      backrest.castShadow = true;
      root.add(backrest);

      for (const ax of [-1.04, 1.04]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.9), primaryMat);
        arm.position.set(ax, 0.44, 0);
        arm.castShadow = true;
        root.add(arm);
      }

      // Accent throw pillows
      for (const px of [-0.82, 0.82]) {
        const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.12), accentMat);
        pillow.position.set(px, 0.52, -0.18);
        pillow.rotation.z = px < 0 ? 0.2 : -0.2;
        pillow.castShadow = true;
        root.add(pillow);
      }
      break;
    }

    case 'armchair': {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.28, 0.76), primaryMat);
      seat.position.set(0, 0.28, 0);
      seat.castShadow = true;
      root.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.44, 0.18), primaryMat);
      back.position.set(0, 0.56, -0.29);
      back.castShadow = true;
      root.add(back);

      for (const ax of [-0.34, 0.34]) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.36, 0.76), primaryMat);
        arm.position.set(ax, 0.46, 0);
        arm.castShadow = true;
        root.add(arm);
      }

      for (const lx of [-0.3, 0.3]) {
        for (const lz of [-0.28, 0.28]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.16, 8), accentMat);
          leg.position.set(lx, 0.08, lz);
          root.add(leg);
        }
      }
      break;
    }

    case 'acoustic_pod': {
      const w = 1.2;
      const d = 1.2;
      const h = 2.15;

      // Floor & roof
      const floorBox = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), primaryMat);
      floorBox.position.y = 0.04;
      root.add(floorBox);

      const roofBox = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), primaryMat);
      roofBox.position.y = h - 0.05;
      roofBox.castShadow = true;
      root.add(roofBox);

      // Solid acoustic back & left/right walls
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.18, 0.08), primaryMat);
      backWall.position.set(0, h / 2, -d / 2 + 0.04);
      backWall.castShadow = true;
      root.add(backWall);

      for (const sx of [-w / 2 + 0.04, w / 2 - 0.04]) {
        const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.08, h - 0.18, d), primaryMat);
        sideWall.position.set(sx, h / 2, 0);
        sideWall.castShadow = true;
        root.add(sideWall);
      }

      // Front glass door
      const glassDoor = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.16, h - 0.2, 0.03),
        new THREE.MeshPhysicalMaterial({
          color: '#bae6fd',
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
        })
      );
      glassDoor.position.set(0, h / 2, d / 2 - 0.03);
      root.add(glassDoor);

      // Interior laptop shelf + stool
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.04, 0.38), accentMat);
      shelf.position.set(0, 0.95, -0.32);
      root.add(shelf);

      const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.65, 16), accentMat);
      stool.position.set(0, 0.35, 0.15);
      root.add(stool);
      break;
    }

    case 'server_rack': {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.98, 0.96), primaryMat);
      rack.position.y = 0.99;
      rack.castShadow = true;
      rack.receiveShadow = true;
      root.add(rack);

      // Server blade LED strips on front face
      for (let b = 0; b < 8; b++) {
        const led = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.03, 0.02),
          new THREE.MeshStandardMaterial({
            color: item.accentColor,
            emissive: item.accentColor,
            emissiveIntensity: 0.85,
          })
        );
        led.position.set(0, 0.35 + b * 0.2, 0.485);
        root.add(led);
      }
      break;
    }

    case 'whiteboard': {
      const board = new THREE.Mesh(new THREE.BoxGeometry(1.72, 1.05, 0.04), primaryMat);
      board.position.y = 1.28;
      board.castShadow = true;
      root.add(board);

      // Frame posts & casters
      for (const px of [-0.88, 0.88]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.82, 0.045), accentMat);
        post.position.set(px, 0.91, 0);
        post.castShadow = true;
        root.add(post);

        const baseFoot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.54), accentMat);
        baseFoot.position.set(px, 0.02, 0);
        root.add(baseFoot);
      }
      break;
    }

    case 'bookshelf': {
      const w = 1.56;
      const d = 0.4;
      const h = 1.92;

      // Side uprights
      for (const sx of [-w / 2 + 0.025, w / 2 - 0.025]) {
        const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, d), primaryMat);
        side.position.set(sx, h / 2, 0);
        side.castShadow = true;
        root.add(side);
      }

      // 5 horizontal shelves + decorative books
      const bookColors = ['#0284c7', '#f59e0b', '#10b981', '#e11d48', '#6366f1', '#e2e8f0'];
      for (let s = 0; s < 5; s++) {
        const sy = 0.12 + s * 0.43;
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), primaryMat);
        shelf.position.set(0, sy, 0);
        shelf.castShadow = true;
        root.add(shelf);

        if (s < 4) {
          for (let b = 0; b < 5; b++) {
            const bookMat = new THREE.MeshStandardMaterial({
              color: bookColors[(s + b) % bookColors.length],
              roughness: 0.6,
            });
            const book = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.24), bookMat);
            book.position.set(-0.52 + b * 0.22, sy + 0.15, 0);
            root.add(book);
          }
        }
      }
      break;
    }

    case 'credenza': {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.56, 0.48), primaryMat);
      body.position.y = 0.4;
      body.castShadow = true;
      body.receiveShadow = true;
      root.add(body);

      const topVeneer = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.04, 0.52), accentMat);
      topVeneer.position.y = 0.7;
      topVeneer.castShadow = true;
      root.add(topVeneer);

      for (const lx of [-0.78, 0.78]) {
        for (const lz of [-0.18, 0.18]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), darkMetalMat);
          leg.position.set(lx, 0.06, lz);
          root.add(leg);
        }
      }
      break;
    }

    case 'coffee_station': {
      // Counter cabinet
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.88, 0.68), primaryMat);
      cabinet.position.y = 0.44;
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      root.add(cabinet);

      // Countertop slab
      const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.05, 0.72), accentMat);
      counterTop.position.y = 0.9;
      counterTop.castShadow = true;
      root.add(counterTop);

      // Commercial espresso machine
      const espresso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.44), chromeMat);
      espresso.position.set(-0.35, 1.13, -0.05);
      espresso.castShadow = true;
      root.add(espresso);

      // Grinder
      const grinder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.38, 14), darkMetalMat);
      grinder.position.set(0.28, 1.11, -0.08);
      grinder.castShadow = true;
      root.add(grinder);
      break;
    }

    case 'glass_partition': {
      const w = 2.36;
      const h = 2.08;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.08), primaryMat);
      frame.position.y = h - 0.03;
      root.add(frame);

      const bottomRail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.08), primaryMat);
      bottomRail.position.y = 0.05;
      root.add(bottomRail);

      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.08, h - 0.12, 0.025),
        new THREE.MeshPhysicalMaterial({
          color: '#e0f2fe',
          transparent: true,
          opacity: 0.42,
          roughness: 0.12,
        })
      );
      glass.position.y = h / 2;
      root.add(glass);

      for (const px of [-w / 2 + 0.03, 0, w / 2 - 0.03]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.08), primaryMat);
        post.position.set(px, h / 2, 0);
        post.castShadow = true;
        root.add(post);
      }
      break;
    }

    case 'solid_partition': {
      // 3D Architectural Solid Drywall Dividing Wall with baseboard and top cap
      const w = 3.0;
      const h = 2.7;
      const d = 0.16;

      const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), primaryMat);
      wallMesh.position.y = h / 2;
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      root.add(wallMesh);

      // Baseboard trim on both sides
      const baseboard = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.12, d + 0.03), accentMat);
      baseboard.position.y = 0.06;
      baseboard.castShadow = true;
      root.add(baseboard);

      // Architectural top crown trim
      const topCap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.08, d + 0.03), accentMat);
      topCap.position.y = h - 0.04;
      topCap.castShadow = true;
      root.add(topCap);
      break;
    }

    case 'potted_plant': {
      // Ceramic planter pot
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.46, 18), accentMat);
      pot.position.y = 0.23;
      pot.castShadow = true;
      pot.receiveShadow = true;
      root.add(pot);

      // Trunk
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.8 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.72, 10), trunkMat);
      trunk.position.y = 0.68;
      root.add(trunk);

      // Foliage clusters
      const foliagePos = [
        [0, 1.18, 0, 0.34],
        [-0.18, 1.02, 0.14, 0.24],
        [0.2, 1.06, -0.12, 0.26],
        [0.12, 1.32, 0.12, 0.22],
        [-0.14, 1.26, -0.15, 0.23],
      ];
      for (const [fx, fy, fz, fr] of foliagePos) {
        const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(fr, 1), primaryMat);
        leaf.position.set(fx, fy, fz);
        leaf.castShadow = true;
        root.add(leaf);
      }
      break;
    }

    case 'floor_lamp': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 20), accentMat);
      base.position.y = 0.02;
      root.add(base);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.72, 12), accentMat);
      pole.position.y = 0.88;
      pole.castShadow = true;
      root.add(pole);

      const shadeMat = new THREE.MeshStandardMaterial({
        color: item.primaryColor,
        emissive: item.primaryColor,
        emissiveIntensity: 0.75,
        roughness: 0.3,
      });
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.28, 20), shadeMat);
      shade.position.set(0, 1.72, 0);
      root.add(shade);

      // Subtle warm point light inside the lamp shade
      const pointLight = new THREE.PointLight(item.primaryColor || '#fbbf24', 1.6, 5.5);
      pointLight.position.set(0, 1.6, 0);
      root.add(pointLight);
      break;
    }

    case 'area_rug': {
      const rug = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.018, 2.3), primaryMat);
      rug.position.y = 0.009;
      rug.receiveShadow = true;
      root.add(rug);

      const border = new THREE.Mesh(new THREE.BoxGeometry(3.38, 0.012, 2.38), accentMat);
      border.position.y = 0.006;
      border.receiveShadow = true;
      root.add(border);
      break;
    }

    case 'ping_pong_table': {
      // Tournament Ping-Pong Table
      const tw = 2.74;
      const td = 1.52;
      const th = 0.76;
      const metalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4, metalness: 0.8 });
      const tableTopMat = new THREE.MeshStandardMaterial({ color: item.primaryColor || '#065f46', roughness: 0.35 });
      const lineMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

      // Tabletop slab
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.05, td), tableTopMat);
      tableTop.position.y = th;
      tableTop.castShadow = true;
      tableTop.receiveShadow = true;
      root.add(tableTop);

      // Center white line
      const centerLine = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.052, 0.015), lineMat);
      centerLine.position.y = th + 0.001;
      root.add(centerLine);

      // Net assembly
      const netMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.65 });
      const net = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, td + 0.16), netMat);
      net.position.y = th + 0.08;
      root.add(net);

      // Table legs & crossbars
      for (const lx of [-tw * 0.4, tw * 0.4]) {
        for (const lz of [-td * 0.42, td * 0.42]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, th, 0.06), metalMat);
          leg.position.set(lx, th / 2, lz);
          leg.castShadow = true;
          root.add(leg);
        }
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, td * 0.84), metalMat);
        brace.position.set(lx, th * 0.3, 0);
        root.add(brace);
      }
      break;
    }

    case 'smartboard': {
      // 85" Interactive 4K Collaboration Smartboard
      const screenW = 1.9;
      const screenH = 1.15;
      const totalH = 1.9;
      const frameMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3, metalness: 0.85 });
      const screenMat = new THREE.MeshStandardMaterial({
        color: '#090d16',
        roughness: 0.15,
        metalness: 0.4,
        emissive: new THREE.Color('#0284c7'),
        emissiveIntensity: 0.18,
      });

      const standY = totalH - screenH / 2;
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, totalH - 0.1, 12), frameMat);
      postL.position.set(-screenW * 0.44, (totalH - 0.1) / 2, 0);
      root.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, totalH - 0.1, 12), frameMat);
      postR.position.set(screenW * 0.44, (totalH - 0.1) / 2, 0);
      root.add(postR);

      for (const px of [-screenW * 0.44, screenW * 0.44]) {
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.55), frameMat);
        foot.position.set(px, 0.04, 0);
        foot.castShadow = true;
        root.add(foot);
      }

      const displayBezel = new THREE.Mesh(new THREE.BoxGeometry(screenW, screenH, 0.06), frameMat);
      displayBezel.position.set(0, standY, 0);
      displayBezel.castShadow = true;
      root.add(displayBezel);

      const displayScreen = new THREE.Mesh(new THREE.BoxGeometry(screenW - 0.08, screenH - 0.08, 0.065), screenMat);
      displayScreen.position.set(0, standY, 0.005);
      root.add(displayScreen);

      const tray = new THREE.Mesh(new THREE.BoxGeometry(screenW * 0.6, 0.025, 0.1), frameMat);
      tray.position.set(0, standY - screenH / 2 - 0.02, 0.05);
      root.add(tray);
      break;
    }

    case 'snack_store': {
      // Micro-Market Pantry & Kiosk
      const w = 2.2;
      const h = 2.0;
      const d = 0.8;
      const cabinetMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });
      const woodAccentMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.6 });
      const glassMat = new THREE.MeshPhysicalMaterial({ color: '#38bdf8', transmission: 0.85, opacity: 0.35, transparent: true, roughness: 0.1 });

      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cabinetMat);
      cabinet.position.set(0, h / 2, 0);
      cabinet.castShadow = true;
      cabinet.receiveShadow = true;
      root.add(cabinet);

      const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(0.9, h * 0.82, 0.03), glassMat);
      glassDoor.position.set(-0.55, h * 0.48, d / 2 + 0.015);
      root.add(glassDoor);

      for (let s = 1; s <= 4; s++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.025, d * 0.8), woodAccentMat);
        shelf.position.set(0.52, s * 0.4, 0);
        root.add(shelf);
      }

      const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: '#0284c7', emissive: '#0284c7', emissiveIntensity: 0.35 }));
      tablet.position.set(0.95, 1.15, d / 2 + 0.03);
      tablet.rotation.x = -Math.PI / 12;
      root.add(tablet);

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.16, d + 0.06), woodAccentMat);
      canopy.position.set(0, h + 0.08, 0);
      root.add(canopy);
      break;
    }
  }

  // Selection / Hover ring on the floor under the furniture item
  if (isSelected || isHovered) {
    const radius = Math.max(catEntry.width, catEntry.depth) * 0.62;
    const ringGeo = new THREE.RingGeometry(radius - 0.06, radius, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isSelected ? '#38bdf8' : '#94a3b8',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isSelected ? 0.92 : 0.55,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.022;
    root.add(ring);

    // Direction arrow indicator showing front orientation (+Z)
    const arrowGeo = new THREE.ConeGeometry(0.12, 0.26, 4);
    const arrow = new THREE.Mesh(arrowGeo, ringMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 0.03, radius + 0.14);
    root.add(arrow);
  }

  root.position.set(item.x, 0, item.z);
  root.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);
  const scale = item.scale || 1;
  root.scale.set(scale, scale, scale);

  return root;
}

// 3D Architectural Character Figure for Office Agents
export function buildAgent3DFigure(agent: OfficeAgent, isSelected: boolean = false): THREE.Group {
  const root = new THREE.Group();
  root.name = `agent-${agent.id}`;
  root.userData = { agentId: agent.id };

  const isSitting = agent.state === 'sitting_working';
  const shirtColor = agent.color || '#0284c7';
  const pantsColor = '#1e293b';
  const skinColor = '#e5c298';

  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.55 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

  if (isSitting) {
    // Sitting posture on chair/desk height
    // Thighs
    const thighs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.38), pantsMat);
    thighs.position.set(0, 0.44, 0.18);
    thighs.castShadow = true;
    root.add(thighs);

    // Shins
    const shins = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.14), pantsMat);
    shins.position.set(0, 0.22, 0.32);
    shins.castShadow = true;
    root.add(shins);

    // Torso (upright)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.22), shirtMat);
    torso.position.set(0, 0.75, 0);
    torso.castShadow = true;
    root.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
    head.position.set(0, 1.1, 0);
    head.castShadow = true;
    root.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2d1d14', roughness: 0.9 }));
    hair.position.set(0, 1.12, 0);
    root.add(hair);

    // Hands resting forward (e.g. typing on laptop)
    const arms = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.28), shirtMat);
    arms.position.set(0, 0.68, 0.16);
    root.add(arms);
  } else {
    // Standing posture
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.78, 0.16), pantsMat);
    legs.position.set(0, 0.39, 0);
    legs.castShadow = true;
    root.add(legs);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.52, 0.22), shirtMat);
    torso.position.set(0, 0.98, 0);
    torso.castShadow = true;
    root.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
    head.position.set(0, 1.36, 0);
    head.castShadow = true;
    root.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2d1d14', roughness: 0.9 }));
    hair.position.set(0, 1.38, 0);
    root.add(hair);
  }

  // Ground selection badge ring
  const ringGeo = new THREE.RingGeometry(0.28, 0.36, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: isSelected ? '#38bdf8' : shirtColor,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isSelected ? 0.95 : 0.65,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  root.add(ring);

  // Floating billboard text tag
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.roundRect ? ctx.roundRect(0, 0, 256, 64, 16) : ctx.fillRect(0, 0, 256, 64);
  ctx.fill();
  ctx.strokeStyle = shirtColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(agent.name.slice(0, 18), 128, 28);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px system-ui, sans-serif';
  const stateLabel =
    agent.state === 'sitting_working'
      ? '💻 Working'
      : agent.state === 'coffee_break'
      ? '☕ Coffee'
      : agent.state === 'playing_tennis'
      ? '🏓 Tennis'
      : agent.state === 'using_smartboard'
      ? '📊 Smartboard'
      : agent.state === 'visiting_store'
      ? '🏪 Store'
      : '🚶 Roaming';
  ctx.fillText(`${agent.hierarchy} · ${stateLabel}`, 128, 52);

  const tex = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(0, isSitting ? 1.55 : 1.82, 0);
  sprite.scale.set(1.1, 0.28, 1);
  root.add(sprite);

  root.position.set(agent.x, 0, agent.z);
  return root;
}

