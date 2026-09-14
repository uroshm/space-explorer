import * as THREE from 'three';

// Shared terrain samples are calculated once at startup, never in a frame shader.
const sphere = new THREE.SphereGeometry(1, 40, 28);
const positions = sphere.attributes.position;
const samples = [];
const fract = (value) => value - Math.floor(value);
const mix = (a, b, t) => a + (b - a) * t;
function hash(x, y, z) {
  return fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453);
}
function noise(x, y, z) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    iz = Math.floor(z);
  const smooth = (v) => v * v * (3 - 2 * v);
  const fx = smooth(fract(x)),
    fy = smooth(fract(y)),
    fz = smooth(fract(z));
  const layer = (dz) =>
    mix(
      mix(hash(ix, iy, iz + dz), hash(ix + 1, iy, iz + dz), fx),
      mix(hash(ix, iy + 1, iz + dz), hash(ix + 1, iy + 1, iz + dz), fx),
      fy,
    );
  return mix(layer(0), layer(1), fz);
}
function terrain(x, y, z) {
  return noise(x, y, z) * 0.5 + noise(x * 2.03 + 2.1, y * 2.03 + 4.3, z * 2.03 + 1.2) * 0.25;
}
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i),
    y = positions.getY(i),
    z = positions.getZ(i);
  samples.push({
    y,
    terrain: terrain(x * 4.5, y * 4.5, z * 4.5),
    band: terrain(x * 8, y * 8, z * 8),
    longitude: Math.atan2(z, x),
    latitude: Math.asin(THREE.MathUtils.clamp(y, -1, 1)),
    light:
      0.16 + 0.84 * Math.max((-x * 0.8 + y * 0.55 + z * 0.65) / Math.hypot(0.8, 0.55, 0.65), 0),
  });
}

export function createMobileBodyGeometry(body) {
  const geometry = sphere.clone().scale(body.diameter / 2, body.diameter / 2, body.diameter / 2);
  const colors = new Float32Array(positions.count * 3);
  const colorA = new THREE.Color(body.color);
  const colorB = new THREE.Color(body.secondaryColor ?? body.color);
  const spot = body.features?.spot;
  const spotColor = new THREE.Color(spot?.color ?? '#ffffff');
  const radians = THREE.MathUtils.degToRad;
  const color = new THREE.Color();
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const land =
      body.surface === 'gas'
        ? 0.5 + 0.5 * Math.sin(sample.y * 24 + sample.band * 4)
        : THREE.MathUtils.smoothstep(sample.terrain, 0.32, 0.44);
    color
      .copy(colorA)
      .lerp(colorB, land)
      .multiplyScalar(0.86 + sample.terrain * 0.28);
    if (spot) {
      const longitude = sample.longitude - radians(spot.longitude ?? 0);
      const dx =
        Math.atan2(Math.sin(longitude), Math.cos(longitude)) / radians(spot.size?.[0] ?? 18);
      const dy = (sample.latitude - radians(spot.latitude ?? 0)) / radians(spot.size?.[1] ?? 10);
      color.lerp(spotColor, 1 - THREE.MathUtils.smoothstep(Math.hypot(dx, dy), 0.8, 1));
    }
    // Bake simple sunlight too, avoiding material lighting calculations on phones.
    color.multiplyScalar(sample.light).toArray(colors, i * 3);
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}
