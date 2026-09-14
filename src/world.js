import * as THREE from 'three';
import bodyCatalog from './data/bodies.json' with { type: 'json' };
import { resolveBodies } from './bodies.js';
import { COMET_LIFETIME, createCometSchedule } from './world-timing.js';

function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noiseGLSL = `
  float hash(vec3 p) { p = fract(p * .3183099 + vec3(.1,.2,.3)); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x) {
    vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p) {
    float v = 0.;
    float a = .5;
#ifdef LOW_QUALITY
    for (int i = 0; i < 3; i++) {
#else
    for (int i = 0; i < 5; i++) {
#endif
      v += a * noise(p);
      p = p * 2.03 + vec3(2.1, 4.3, 1.2);
      a *= .5;
    }
    return v;
  }
`;

export function createWorld(scene, { lowQuality = false } = {}) {
  const qualityShaderDefine = lowQuality ? '#define LOW_QUALITY\n' : '';
  const layoutScale = 1.72;
  const bodies = resolveBodies(bodyCatalog).map((body) => ({
    ...body,
    position: body.position.map((coordinate) => coordinate * layoutScale),
  }));
  const random = randomGenerator(1207);
  scene.background = new THREE.Color(0x000000);
  scene.add(new THREE.AmbientLight(0xa6bdcc, 1.3));
  const sun = new THREE.DirectionalLight(0xffe5c5, 3.6);
  sun.position.set(-2500, 1700, -1000);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x699ebf, 2);
  fill.position.set(0, 3, 10);
  scene.add(fill);

  const sky = new THREE.Group();
  sky.name = 'Starfield';
  const nebula = new THREE.Mesh(
    new THREE.SphereGeometry(90000, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `${qualityShaderDefine}${noiseGLSL}
      varying vec3 vP;
      void main(){
        vec3 d=normalize(vP); float n=fbm(d*4.+vec3(4,0,0));
        float band=exp(-abs(d.y+d.x*.35-.14)*5.5);
        vec3 color=vec3(.003)+vec3(.08)*pow(n,2.)*band;
#ifndef LOW_QUALITY
        color+=vec3(.035)*pow(fbm(d*5.+15.),3.)*band;
#endif
        gl_FragColor=vec4(color,1.);
      }`,
    }),
  );
  sky.add(nebula);
  const comet = new THREE.Group();
  comet.name = 'Distant comet';
  comet.visible = false;
  const cometMaterial = new THREE.MeshBasicMaterial({
    color: 0xe8f8ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const cometTrail = new THREE.Mesh(new THREE.ConeGeometry(4, 220, 7), cometMaterial);
  cometTrail.rotation.z = -Math.PI / 2;
  cometTrail.position.x = -108;
  comet.add(cometTrail);
  comet.add(new THREE.Mesh(new THREE.SphereGeometry(7, 8, 6), cometMaterial));
  sky.add(comet);
  const cometSchedule = createCometSchedule(random);
  let cometStartedAt = 0;
  let cometActive = false;
  const cometStart = new THREE.Vector3();
  const cometVelocity = new THREE.Vector3();
  const cometDirection = new THREE.Vector3();
  const cometRotation = new THREE.Quaternion();
  const starLayers = [
    { size: 1.7, points: [], colors: [] },
    { size: 2.2, points: [], colors: [] },
    { size: 2.8, points: [], colors: [] },
  ];
  const starColor = new THREE.Color();
  for (let i = 0; i < 6500; i++) {
    const theta = random() * Math.PI * 2;
    const y = random() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const sizeRoll = random();
    const layer = starLayers[sizeRoll < 0.82 ? 0 : sizeRoll < 0.98 ? 1 : 2];
    layer.points.push(Math.cos(theta) * r * 80000, y * 80000, Math.sin(theta) * r * 80000);
    starColor.setHSL(0.08 + random() * 0.56, 0.12 + random() * 0.2, 0.3 + random() * 0.55);
    layer.colors.push(starColor.r, starColor.g, starColor.b);
  }
  for (const layer of starLayers) {
    const stars = new THREE.BufferGeometry();
    stars.setAttribute('position', new THREE.Float32BufferAttribute(layer.points, 3));
    stars.setAttribute('color', new THREE.Float32BufferAttribute(layer.colors, 3));
    sky.add(
      new THREE.Points(
        stars,
        new THREE.PointsMaterial({
          size: layer.size,
          sizeAttenuation: false,
          vertexColors: true,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        }),
      ),
    );
  }
  scene.add(sky);

  const colliders = [];
  const planets = [];
  function createBody(body) {
    const { name, position, color: colorA, secondaryColor = colorA, features = {} } = body;
    const colorB = secondaryColor;
    const radius = body.diameter / 2;
    const gas = body.surface === 'gas';
    const spot = features.spot;
    const radians = THREE.MathUtils.degToRad;
    const material = new THREE.ShaderMaterial({
      uniforms: {
        colorA: { value: new THREE.Color(colorA) },
        colorB: { value: new THREE.Color(colorB) },
        bodyRadius: { value: radius },
        gas: { value: gas ? 1 : 0 },
        hasSpot: { value: spot ? 1 : 0 },
        spotColor: { value: new THREE.Color(spot?.color ?? '#ffffff') },
        spotCenter: {
          value: new THREE.Vector2(radians(spot?.longitude ?? 0), radians(spot?.latitude ?? 0)),
        },
        spotSize: { value: new THREE.Vector2(...(spot?.size ?? [18, 10]).map(radians)) },
      },
      vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}`,
      fragmentShader: `${qualityShaderDefine}${noiseGLSL}
        uniform vec3 colorA; uniform vec3 colorB; uniform float bodyRadius; uniform float gas;
        uniform float hasSpot; uniform vec3 spotColor; uniform vec2 spotCenter; uniform vec2 spotSize;
        varying vec3 vP; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 p=normalize(vP); float terrain=fbm(p*4.5);
          float land=smoothstep(.46,.56,terrain);
          if(gas>.5) land=.5+.5*sin(p.y*55.+fbm(p*8.)*13.);
          vec3 color=mix(colorA,colorB,land);
#ifdef LOW_QUALITY
          color*=.86+terrain*.28;
#else
          color*=.8+fbm(p*42.)*.4;
          float cameraDistance=length(cameraPosition-vW)/bodyRadius;
          float closeDetail=1.-smoothstep(3.,18.,cameraDistance);
          float fineTexture=fbm(p*170.+vec3(6.3,2.7,9.1));
          color*=mix(1.,.82+fineTexture*.36,closeDetail);
          float clouds=smoothstep(.60,.76,fbm(p*7.+vec3(9.)));
          color=mix(color,vec3(.73,.83,.79),clouds*.55*(1.-gas));
#endif
          if(hasSpot>.5) {
            float longitude=atan(p.z,p.x);
            float delta=atan(sin(longitude-spotCenter.x),cos(longitude-spotCenter.x));
            vec2 offset=vec2(delta,asin(clamp(p.y,-1.,1.))-spotCenter.y)/spotSize;
            color=mix(color,spotColor,1.-smoothstep(.8,1.,length(offset)));
          }
          float light=max(dot(normalize(vN),normalize(vec3(-.8,.55,.65))),0.);
          color*=.065+light*1.5;
          float rim=pow(1.-max(dot(normalize(vN),normalize(cameraPosition-vW)),0.),3.);
          color+=vec3(.19,.5,.56)*rim*(.08+light*.5);
          gl_FragColor=vec4(color,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, lowQuality ? 40 : 80, lowQuality ? 28 : 56),
      material,
    );
    mesh.name = name;
    mesh.userData = { id: body.id, type: body.type, radius };
    mesh.position.set(...position);
    scene.add(mesh);
    colliders.push({ position: mesh.position, radius });
    planets.push({ mesh, id: body.id, name, type: body.type, radius, position: mesh.position });
    return mesh;
  }

  for (const body of bodies) {
    const mesh = createBody(body);
    const rings = body.features?.rings;
    if (!rings) continue;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(rings.innerRadius, rings.outerRadius, 192),
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          innerRadius: { value: rings.innerRadius },
          width: { value: rings.outerRadius - rings.innerRadius },
          colorA: { value: new THREE.Color(rings.color) },
          colorB: { value: new THREE.Color(rings.outerColor) },
        },
        vertexShader: `varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `
        uniform float innerRadius; uniform float width; uniform vec3 colorA; uniform vec3 colorB;
        varying vec3 vP;
        void main(){float r=length(vP.xy);float t=(r-innerRadius)/width;float stripe=.55+.25*sin(r*.23)+.12*sin(r*.8);float alpha=sin(t*3.14159)*stripe*.65;gl_FragColor=vec4(mix(colorA,colorB,t),alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      }),
    );
    ring.position.copy(mesh.position);
    ring.rotation.set(...rings.rotation);
    scene.add(ring);
  }

  const sunPosition = new THREE.Vector3(0, 6000 * layoutScale, -45000 * layoutScale);
  const sunRadius = 7000;
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius, 64, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd783 }),
  );
  sunMesh.name = 'Sun';
  sunMesh.position.copy(sunPosition);
  scene.add(sunMesh);
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius * 1.22, 32, 20),
    new THREE.MeshBasicMaterial({
      color: 0xf6a949,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    }),
  );
  sunGlow.position.copy(sunPosition);
  scene.add(sunGlow);
  colliders.push({ position: sunMesh.position, radius: sunRadius });
  planets.unshift({
    mesh: sunMesh,
    id: 'sun',
    name: 'Sun',
    type: 'star',
    radius: sunRadius,
    position: sunMesh.position,
  });

  const asteroidGeometry = new THREE.IcosahedronGeometry(1, 1);
  const vertices = asteroidGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i),
      y = vertices.getY(i),
      z = vertices.getZ(i);
    const scale = 1 + 0.13 * Math.sin(x * 17 + y * 23 + z * 11);
    vertices.setXYZ(i, x * scale, y * scale, z * scale);
  }
  asteroidGeometry.computeVertexNormals();
  const asteroidCount = 25;
  const asteroids = new THREE.InstancedMesh(
    asteroidGeometry,
    new THREE.MeshStandardMaterial({ color: 0x746d63, flatShading: true, roughness: 1 }),
    asteroidCount,
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < asteroidCount; i++) {
    dummy.position.set(
      (random() - 0.5) * 6000,
      (random() - 0.5) * 1250 - 200,
      -650 - random() * 5100,
    );
    // Keep the first beacon's approach clear for new pilots.
    if (Math.abs(dummy.position.x) < 100 && Math.abs(dummy.position.y) < 100)
      dummy.position.x += 180;
    const size = 7 + random() ** 2 * 60;
    dummy.scale.set(size, size * (0.6 + random() * 0.4), size);
    dummy.rotation.set(random() * 6, random() * 6, random() * 6);
    dummy.updateMatrix();
    asteroids.setMatrixAt(i, dummy.matrix);
    colliders.push({ position: dummy.position.clone(), radius: size * 1.15 });
  }
  scene.add(asteroids);

  const bodyApproach = (id) => {
    const body = bodies.find((body) => body.id === id);
    const center = new THREE.Vector3(...body.position);
    return center.addScaledVector(center.clone().normalize(), body.diameter / 2 + 80);
  };
  const solarStops = [
    {
      name: 'Mercury flyby',
      id: 'mercury',
      type: 'Planetary observation',
      info: 'The closest world to the Sun: a small, cratered planet of iron and stone.',
    },
    {
      name: 'Venus flyby',
      id: 'venus',
      type: 'Planetary observation',
      info: 'A bright, cloud-wrapped world with a crushing atmosphere.',
    },
    {
      name: 'Earth orbit',
      id: 'earth',
      type: 'Planetary observation',
      info: 'The blue home world, seen from the quiet of space.',
    },
    {
      name: 'Moon outpost',
      id: 'moon',
      type: 'Lunar research station',
      info: 'An automated observatory listening to the quiet side of the Moon.',
    },
    {
      name: 'Mars overlook',
      id: 'mars',
      type: 'Planetary observation',
      info: 'A red desert world marked by ancient rivers and towering volcanoes.',
    },
    {
      name: 'Ceres waypoint',
      id: 'ceres',
      type: 'Dwarf planet observation',
      info: 'The largest body in the asteroid belt and a dwarf planet of its own.',
    },
    {
      name: 'Jupiter approach',
      id: 'jupiter',
      type: 'Planetary observation',
      info: 'A banded gas giant with a centuries-old storm.',
    },
    {
      name: 'Saturn overlook',
      id: 'saturn',
      type: 'Planetary observation',
      info: 'A gas giant surrounded by rings of ice and dust.',
    },
    {
      name: 'Uranus flyby',
      id: 'uranus',
      type: 'Planetary observation',
      info: 'A close pass through the pale blue atmosphere of Uranus.',
    },
    {
      name: 'Neptune flyby',
      id: 'neptune',
      type: 'Planetary observation',
      info: 'A distant blue giant swept by supersonic winds.',
    },
    {
      name: 'Pluto flyby',
      id: 'pluto',
      type: 'Dwarf planet observation',
      info: 'A faraway world of nitrogen ice at the edge of the Kuiper belt.',
    },
    {
      name: 'Haumea flyby',
      id: 'haumea',
      type: 'Dwarf planet observation',
      info: 'A rapidly spinning, elongated dwarf planet beyond Neptune.',
    },
    {
      name: 'Makemake flyby',
      id: 'makemake',
      type: 'Dwarf planet observation',
      info: 'A bright, frozen dwarf planet in the outer Solar System.',
    },
    {
      name: 'Eris flyby',
      id: 'eris',
      type: 'Dwarf planet observation',
      info: 'A distant dwarf planet nearly as large as Pluto.',
    },
  ];
  const destinations = [
    {
      id: 'first-signal',
      name: 'The first signal',
      type: 'Navigation beacon',
      position: new THREE.Vector3(0, 0, -700),
      info: 'A small signal in a very big universe. Your journey has begun.',
    },
    {
      id: 'solar-flyby',
      name: 'Solar flyby',
      type: 'Solar observation',
      position: sunPosition
        .clone()
        .addScaledVector(sunPosition.clone().normalize(), -sunRadius - 80),
      info: 'A close pass around the star at the heart of our system.',
    },
    ...solarStops.map((stop) => ({ ...stop, position: bodyApproach(stop.id) })),
    {
      id: 'asteroid-belt',
      name: 'Asteroid belt survey',
      type: 'Deep-space observation',
      position: new THREE.Vector3(0, 0, -22000),
      info: 'A broad region between Mars and Jupiter filled with rocky and metallic bodies.',
    },
    {
      id: 'kuiper-belt',
      name: 'Kuiper belt survey',
      type: 'Deep-space observation',
      position: new THREE.Vector3(-6000, 0, -41000),
      info: 'A distant region beyond Neptune containing many small icy worlds.',
    },
    {
      id: 'heliopause',
      name: 'Heliopause station',
      type: 'Deep-space observation',
      position: new THREE.Vector3(12000, 6000, 56000),
      info: 'The boundary where the Sun’s solar wind gives way to interstellar space.',
    },
    {
      id: 'outer-reaches',
      name: 'The outer reaches',
      type: 'Deep space relay',
      position: new THREE.Vector3(-4400, 1000, -9200),
      info: 'The last relay before open space. There is always a little further to go.',
    },
  ];
  for (const destination of destinations) {
    const group = new THREE.Group();
    group.position.copy(destination.position);
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(38, 0.8, 8, 80),
      new THREE.MeshBasicMaterial({ color: 0x9df3d6 }),
    );
    group.add(ringMesh);
    const outer = new THREE.Mesh(
      new THREE.TorusGeometry(43, 0.28, 6, 80, Math.PI * 1.5),
      new THREE.MeshBasicMaterial({ color: 0x557f7b }),
    );
    group.add(outer);
    destination.mesh = group;
    destination.discovered = false;
    destination.visitActive = false;
    scene.add(group);
  }

  const dustGeometry = new THREE.BufferGeometry();
  const dust = new Float32Array(270 * 3);
  for (let i = 0; i < dust.length; i++) dust[i] = (random() - 0.5) * 500;
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPoints = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xa5d6ce,
      size: 0.45,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  scene.add(dustPoints);

  return {
    colliders,
    destinations,
    planets,
    update(dt, time, position, orientation = new THREE.Quaternion()) {
      sky.position.copy(position);
      if (!cometActive && cometSchedule.isDue(time)) {
        cometRotation.copy(orientation);
        cometStart
          .set((random() - 0.5) * 1800, (random() - 0.5) * 1100, -7000)
          .applyQuaternion(cometRotation);
        cometVelocity
          .set(1150 + random() * 650, 350 + random() * 650, 0)
          .applyQuaternion(cometRotation);
        cometDirection.copy(cometVelocity).normalize();
        comet.position.copy(cometStart);
        comet.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), cometDirection);
        comet.visible = true;
        cometActive = true;
        cometStartedAt = time;
      }
      if (cometActive) {
        const progress = (time - cometStartedAt) / COMET_LIFETIME;
        if (progress >= 1) {
          comet.visible = false;
          cometMaterial.opacity = 0;
          cometActive = false;
          cometSchedule.reschedule(time);
        } else {
          comet.position.copy(cometStart).addScaledVector(cometVelocity, progress);
          cometMaterial.opacity = Math.sin(progress * Math.PI) * 0.85;
        }
      }
      planets.forEach(({ mesh }) => {
        mesh.rotation.y += dt * 0.008;
      });
      for (const d of destinations) {
        d.mesh.children[1].rotation.z = time * 0.15;
        d.mesh.children[0].material.color.setHex(d.discovered ? 0x4f7370 : 0x9df3d6);
      }
      for (let i = 0; i < dust.length; i += 3) {
        for (let axis = 0; axis < 3; axis++) {
          const center = position.getComponent(axis);
          dust[i + axis] =
            center + THREE.MathUtils.euclideanModulo(dust[i + axis] - center + 250, 500) - 250;
        }
      }
      dustGeometry.attributes.position.needsUpdate = true;
    },
  };
}
