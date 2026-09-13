// Resolve the editable catalog into world positions before creating any meshes.
export function resolveBodies(catalog) {
  if (!Array.isArray(catalog)) throw new Error('Body catalog must be an array.');
  const byId = new Map();
  const vector = (value, length) =>
    Array.isArray(value) && value.length === length && value.every(Number.isFinite);
  const color = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
  for (const body of catalog) {
    const fail = (message) => {
      throw new Error(`Body ${body?.id ?? '(missing id)'}: ${message}`);
    };
    if (!body || typeof body.id !== 'string' || !body.id || byId.has(body.id))
      fail('id must be unique and nonempty.');
    if (typeof body.name !== 'string' || !body.name.trim()) fail('name is required.');
    if (!['planet', 'moon', 'dwarf-planet'].includes(body.type))
      fail('type must be planet, moon, or dwarf-planet.');
    if (!Number.isFinite(body.diameter) || body.diameter <= 0) fail('diameter must be positive.');
    if (!vector(body.position, 3)) fail('position must contain three finite numbers.');
    if (!color(body.color) || (body.secondaryColor !== undefined && !color(body.secondaryColor)))
      fail('colors must use #RRGGBB.');
    if (body.surface !== undefined && !['rocky', 'gas'].includes(body.surface))
      fail('surface must be rocky or gas.');
    if (body.parent !== undefined && (body.type !== 'moon' || typeof body.parent !== 'string'))
      fail('only moons can specify a parent id.');
    if (
      body.features !== undefined &&
      (!body.features || typeof body.features !== 'object' || Array.isArray(body.features))
    )
      fail('features must be an object.');
    for (const key of Object.keys(body.features ?? {})) {
      if (!['rings', 'spot'].includes(key)) fail(`unsupported feature: ${key}.`);
    }
    const rings = body.features?.rings;
    if (
      rings !== undefined &&
      (!rings ||
        !Number.isFinite(rings.innerRadius) ||
        !Number.isFinite(rings.outerRadius) ||
        rings.innerRadius <= body.diameter / 2 ||
        rings.outerRadius <= rings.innerRadius ||
        !color(rings.color) ||
        !color(rings.outerColor) ||
        !vector(rings.rotation, 3))
    )
      fail('rings need radii outside the body, two colors, and a rotation vector.');
    const spot = body.features?.spot;
    if (
      spot !== undefined &&
      (!spot ||
        !color(spot.color) ||
        !Number.isFinite(spot.latitude) ||
        Math.abs(spot.latitude) > 90 ||
        !Number.isFinite(spot.longitude) ||
        !vector(spot.size, 2) ||
        spot.size.some((size) => size <= 0 || size > 180))
    )
      fail('spot needs a color, latitude (-90 to 90), longitude, and size (0 to 180 degrees).');
    byId.set(body.id, body);
  }
  const resolved = new Map();
  const resolving = new Set();
  function resolve(body) {
    if (resolved.has(body.id)) return resolved.get(body.id);
    if (resolving.has(body.id)) throw new Error(`Body ${body.id}: circular parent reference.`);
    resolving.add(body.id);
    let position = [...body.position];
    if (body.parent !== undefined) {
      const parent = byId.get(body.parent);
      if (!parent) throw new Error(`Body ${body.id}: unknown parent ${body.parent}.`);
      const origin = resolve(parent).position;
      position = position.map((component, axis) => component + origin[axis]);
    }
    const result = { ...body, position };
    resolved.set(body.id, result);
    resolving.delete(body.id);
    return result;
  }
  return catalog.map(resolve);
}
