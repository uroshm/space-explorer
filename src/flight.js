import { Euler, MathUtils, Quaternion, Vector3 } from 'three';

export const CRUISE_SPEED = 180;
export const BOOST_SPEED = 480;
const rotation = new Quaternion();
const forward = new Vector3();
const normal = new Vector3();

export class Flight {
  constructor() {
    this.position = new Vector3();
    this.quaternion = new Quaternion();
    this.reset();
  }

  reset() {
    this.position.set(0, 0, 0);
    this.quaternion.identity();
    this.speed = 0;
    this.throttle = 0.32;
    this.energy = 100;
    this.boosting = false;
    this.boostLocked = false;
    this.distance = 0;
    this.bank = 0;
  }

  update(dt, input) {
    dt = Math.min(Math.max(dt, 0), 0.05);
    this.throttle = MathUtils.clamp(this.throttle + (input.thrust || 0) * dt * 0.65, 0, 1);
    if (input.brake) this.throttle = Math.max(0, this.throttle - dt * 1.5);
    if (this.energy >= 30) this.boostLocked = false;
    this.boosting = Boolean(input.boost && !input.brake && !this.boostLocked && this.energy > 0);
    this.energy = MathUtils.clamp(this.energy + (this.boosting ? -24 : 14) * dt, 0, 100);
    if (this.energy === 0) this.boostLocked = true;
    const targetSpeed = input.brake ? 0 : this.boosting ? BOOST_SPEED : this.throttle * CRUISE_SPEED;
    this.speed = MathUtils.damp(this.speed, targetSpeed, input.brake ? 3.5 : 1.5, dt);
    const sensitivity = (this.boosting ? 0.7 : 1.15) * (input.keyboardSteering ? 1.4 : 1);
    rotation.setFromEuler(new Euler(
      (input.pitch || 0) * dt * sensitivity,
      -(input.yaw || 0) * dt * sensitivity,
      -(input.roll || 0) * dt * 1.5,
      'YXZ',
    ));
    this.quaternion.multiply(rotation).normalize();
    this.bank = MathUtils.damp(this.bank, -(input.yaw || 0) * 0.35, 5, dt);
    forward.set(0, 0, -1).applyQuaternion(this.quaternion);
    this.position.addScaledVector(forward, this.speed * dt);
    this.distance += this.speed * dt;
  }

  resolveCollisions(colliders) {
    let collided = false;
    for (const body of colliders) {
      const clearance = body.radius + 5;
      const distance = this.position.distanceTo(body.position);
      if (distance < clearance) {
        normal.subVectors(this.position, body.position);
        if (normal.lengthSq() < 0.0001) normal.set(0, 0, 1);
        normal.normalize();
        this.position.copy(body.position).addScaledVector(normal, clearance);
        this.speed *= 0.2;
        this.throttle = 0;
        this.boosting = false;
        collided = true;
      }
    }
    return collided;
  }
}
