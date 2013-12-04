function SensorAnimal(opt_options) {
  var options = opt_options || {};
  options.name = options.name || 'SensorAnimal';
  Mover.call(this, options);
}
Utils.extend(SensorAnimal, Mover);

SensorAnimal.prototype.init = function(opt_options) {

  var options = opt_options || {};
  SensorAnimal._superClass.prototype.init.call(this, options);

  this.type = options.type || '';
  this.behavior = options.behavior || 'LOVE';
  this.sensitivity = typeof options.sensitivity === 'undefined' ? 2 : options.sensitivity;
  this.width = typeof options.width === 'undefined' ? 7 : options.width;
  this.height = typeof options.height === 'undefined' ? 7 : options.height;
  this.offsetDistance = typeof options.offsetDistance === 'undefined' ? 30 : options.offsetDistance;
  this.offsetAngle = options.offsetAngle || 0;
  this.opacity = typeof options.opacity === 'undefined' ? 0.75 : options.opacity;
  this.target = options.target || null;
  this.activated = !!options.activated;
  this.activatedColor = options.activatedColor || [255, 255, 255];
  this.borderRadius = typeof options.borderRadius === 'undefined' ? 100 : options.borderRadius;
  this.borderWidth = typeof options.borderWidth === 'undefined' ? 2 : options.borderWidth;
  this.borderStyle = 'solid';
  this.borderColor = [255, 255, 255];
};

/**
 * Called every frame, step() updates the instance's properties.
 */
SensorAnimal.prototype.step = function() {

  var check = false, i, max;

  var sheep = Burner.System._caches.Sheep || {list: []};

  if (this.type === 'sheep' && sheep.list && sheep.list.length > 0) {
    for (i = 0, max = sheep.list.length; i < max; i++) { // heat
      if (this.isInside(this, sheep.list[i], this.sensitivity)) {
        this.target = sheep.list[i]; // target this stimulator
        this.activated = true; // set activation
        check = true;
      }
    }
  }
  if (!check) {
    this.target = null;
    this.activated = false;
    this.color = 'transparent';
  } else {
    this.color = this.activatedColor;
  }
  if (this.afterStep) {
    this.afterStep.apply(this);
  }

};

/**
 * Returns a force to apply to an agent when its sensor is activated.
 *
 */
SensorAnimal.prototype.getActivationForce = function(agent) {

  var distanceToTarget, desiredVelocity, m;

  if (this.behavior === 'AGGRESSIVE') {
    desiredVelocity = Burner.Vector.VectorSub(this.target.location, this.location);
    distanceToTarget = desiredVelocity.mag();
    desiredVelocity.normalize();

    m = distanceToTarget/agent.maxSpeed;
    desiredVelocity.mult(m);

    desiredVelocity.sub(agent.velocity);
    desiredVelocity.limit(agent.maxSteeringForce);
    console.log('aggro....');

    return desiredVelocity;
  }
  if (this.behavior === 'LIKES') {
      desiredVelocity = Burner.Vector.VectorSub(this.target.location, this.location);
      distanceToTarget = desiredVelocity.mag();
      desiredVelocity.normalize();

      m = distanceToTarget/agent.maxSpeed;
      desiredVelocity.mult(m);

      steer = Burner.Vector.VectorSub(desiredVelocity, agent.velocity);
      steer.limit(agent.maxSteeringForce);
      console.log('steering...');
      return steer;
  }
  if (this.behavior === 'LOVES') {
    var dvLoves = Burner.Vector.VectorSub(this.target.location, this.location); // desiredVelocity
    distanceToTarget = dvLoves.mag();
    dvLoves.normalize();

    if (distanceToTarget > this.width) {
      m = distanceToTarget/agent.maxSpeed;
      dvLoves.mult(m);
      steer = Burner.Vector.VectorSub(dvLoves, agent.velocity);
      steer.limit(agent.maxSteeringForce);
      return steer;
    }
    agent.velocity = new Burner.Vector();
    agent.acceleration = new Burner.Vector();
    return new Burner.Vector();
  }
  console.log('doing nothing');
  return new Burner.Vector();
};

/**
 * Checks if a sensor can detect a stimulator.
 *
 * @param {Object} params The sensor.
 * @param {Object} container The stimulator.
 * @param {number} sensitivity The sensor's sensitivity.
 */
SensorAnimal.prototype.isInside = function(item, container, sensitivity) {

  if (item.location.x + item.width/2 > container.location.x - container.width/2 - (sensitivity * container.width) &&
    item.location.x - item.width/2 < container.location.x + container.width/2 + (sensitivity * container.width) &&
    item.location.y + item.height/2 > container.location.y - container.height/2 - (sensitivity * container.height) &&
    item.location.y - item.height/2 < container.location.y + container.height/2 + (sensitivity * container.height)) {
    return true;
  }
  return false;
};