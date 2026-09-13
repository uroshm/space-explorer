import * as THREE from 'three';
import bodyCatalog from './data/bodies.json';
import { resolveBodies } from './bodies.js';

function randomGenerator(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const noiseGLSL = `
  float hash(vec3 p) { p = fract(p * .3183099 + vec3(.1,.2,.3)); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x) {
    vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p) { float v=0.; float a=.5; for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec3(2.1,4.3,1.2);a*=.5;} return v; }
`;

export function createWorld(scene) {
  const bodies = resolveBodies(bodyCatalog);
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
  const nebula = new THREE.Mesh(new THREE.SphereGeometry(90000, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vP; void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `${noiseGLSL}
      varying vec3 vP;
      void main(){
        vec3 d=normalize(vP); float n=fbm(d*4.+vec3(4,0,0));
        float band=exp(-abs(d.y+d.x*.35-.14)*5.5);
        vec3 color=vec3(.003)+vec3(.08)*pow(n,2.)*band;
        color+=vec3(.035)*pow(fbm(d*5.+15.),3.)*band;
        gl_FragColor=vec4(color,1.);
      }`,
  }));
  sky.add(nebula);
  const points = [], colors = [];
  const starColor = new THREE.Color();
  for (let i = 0; i < 6500; i++) {
    const theta = random() * Math.PI * 2;
    const y = random() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    points.push(Math.cos(theta) * r * 80000, y * 80000, Math.sin(theta) * r * 80000);
    starColor.setHSL(0.08 + random() * 0.56, 0.12 + random() * 0.2, 0.3 + random() * 0.55);
    colors.push(starColor.r, starColor.g, starColor.b);
  }
  const stars = new THREE.BufferGeometry();
  stars.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  stars.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  sky.add(new THREE.Points(stars, new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false })));
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
      uniforms: { colorA: { value: new THREE.Color(colorA) }, colorB: { value: new THREE.Color(colorB) }, gas: { value: gas ? 1 : 0 },
        hasSpot: { value: spot ? 1 : 0 },
        spotColor: { value: new THREE.Color(spot?.color ?? '#ffffff') },
        spotCenter: { value: new THREE.Vector2(radians(spot?.longitude ?? 0), radians(spot?.latitude ?? 0)) },
        spotSize: { value: new THREE.Vector2(...(spot?.size ?? [18, 10]).map(radians)) },
      },
      vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vW; void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}`,
      fragmentShader: `${noiseGLSL}
        uniform vec3 colorA; uniform vec3 colorB; uniform float gas;
        uniform float hasSpot; uniform vec3 spotColor; uniform vec2 spotCenter; uniform vec2 spotSize;
        varying vec3 vP; varying vec3 vN; varying vec3 vW;
        void main(){
          vec3 p=normalize(vP); float terrain=fbm(p*4.5);
          float land=smoothstep(.46,.56,terrain);
          if(gas>.5) land=.5+.5*sin(p.y*55.+fbm(p*8.)*13.);
          vec3 color=mix(colorA,colorB,land);
          color*=.8+fbm(p*42.)*.4;
          float clouds=smoothstep(.60,.76,fbm(p*7.+vec3(9.)));
          color=mix(color,vec3(.73,.83,.79),clouds*.55*(1.-gas));
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
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 80, 56), material);
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
    const ring = new THREE.Mesh(new THREE.RingGeometry(rings.innerRadius, rings.outerRadius, 192), new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
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
    }));
    ring.position.copy(mesh.position);
    ring.rotation.set(...rings.rotation);
    scene.add(ring);
  }

  const asteroidGeometry = new THREE.IcosahedronGeometry(1, 1);
  const vertices = asteroidGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const scale = 1 + 0.13 * Math.sin(x * 17 + y * 23 + z * 11);
    vertices.setXYZ(i, x * scale, y * scale, z * scale);
  }
  asteroidGeometry.computeVertexNormals();
  const asteroidCount = 100;
  const asteroids = new THREE.InstancedMesh(asteroidGeometry, new THREE.MeshStandardMaterial({ color: 0x746d63, flatShading: true, roughness: 1 }), asteroidCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < asteroidCount; i++) {
    dummy.position.set((random() - 0.5) * 6000, (random() - 0.5) * 1250 - 200, -650 - random() * 5100);
    // Keep the first beacon's approach clear for new pilots.
    if (Math.abs(dummy.position.x) < 100 && Math.abs(dummy.position.y) < 100) dummy.position.x += 180;
    const size = 7 + random() ** 2 * 60;
    dummy.scale.set(size, size * (0.6 + random() * 0.4), size);
    dummy.rotation.set(random() * 6, random() * 6, random() * 6);
    dummy.updateMatrix();
    asteroids.setMatrixAt(i, dummy.matrix);
    colliders.push({ position: dummy.position.clone(), radius: size * 1.15 });
  }
  scene.add(asteroids);

  const nearBody = (id, offset) => {
    const body = bodies.find((body) => body.id === id);
    return new THREE.Vector3(...body.position).add(new THREE.Vector3(...offset));
  };
  const destinations = [
    { name: 'The first signal', type: 'Navigation beacon', position: new THREE.Vector3(0, 0, -700), info: 'A small signal in a very big universe. Your journey has begun.' },
    { name: 'Moon outpost', type: 'Lunar research station', position: nearBody('moon', [350, 280, 500]), info: 'An automated observatory listening to the quiet side of the Moon.' },
    { name: 'Saturn overlook', type: 'Planetary observation', position: nearBody('saturn', [-1130, 130, 400]), info: 'A gas giant surrounded by rings of ice and dust.' },
    { name: 'The outer reaches', type: 'Deep space relay', position: new THREE.Vector3(-4400, 1000, -9200), info: 'The last relay before open space. There is always a little further to go.' },
  ];
  for (const destination of destinations) {
    const group = new THREE.Group();
    group.position.copy(destination.position);
    const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(38, 0.8, 8, 80), new THREE.MeshBasicMaterial({ color: 0x9df3d6 }));
    group.add(ringMesh);
    const outer = new THREE.Mesh(new THREE.TorusGeometry(43, 0.28, 6, 80, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: 0x557f7b }));
    group.add(outer);
    destination.mesh = group;
    destination.discovered = false;
    scene.add(group);
  }

  const dustGeometry = new THREE.BufferGeometry();
  const dust = new Float32Array(270 * 3);
  for (let i = 0; i < dust.length; i++) dust[i] = (random() - 0.5) * 500;
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
  const dustPoints = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xa5d6ce, size: 0.45, transparent: true, opacity: 0.35, depthWrite: false }));
  scene.add(dustPoints);

  return {
    colliders, destinations, planets,
    update(dt, time, position) {
      sky.position.copy(position);
      planets.forEach(({ mesh }) => { mesh.rotation.y += dt * 0.008; });
      for (const d of destinations) {
        d.mesh.children[1].rotation.z = time * 0.15;
        d.mesh.children[0].material.color.setHex(d.discovered ? 0x4f7370 : 0x9df3d6);
      }
      for (let i = 0; i < dust.length; i += 3) {
        for (let axis = 0; axis < 3; axis++) {
          const center = position.getComponent(axis);
          dust[i + axis] = center + THREE.MathUtils.euclideanModulo(dust[i + axis] - center + 250, 500) - 250;
        }
      }
      dustGeometry.attributes.position.needsUpdate = true;
    },
  };
}
