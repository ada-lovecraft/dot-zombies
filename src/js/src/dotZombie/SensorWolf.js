

function SensorWolf(opt_options) {
  var options = opt_options || {};
  options.name = options.name || 'SensorWolf';
  Mover.call(this, options);
}
Utils.extend(SensorWolf, SensorAnimal);

/**
 * Called every frame, step() updates the instance's properties.
 */
SensorWolf.prototype.step = function() {

  var check = false, i, max;

  var wolves = Burner.System._caches.Wolf || {list: []};

  if (this.type === 'wolf' && wolves.list && wolves.list.length > 0) {
    for (i = 0, max = wolves.list.length; i < max; i++) { // heat
      if (this.isInside(this, wolves.list[i], this.sensitivity)) {
        this.target = wolves.list[i]; // target this stimulator
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
SensorWolf.prototype.getActivationForce = function(agent) {

  var distanceToTarget, desiredVelocity, m;

  if (this.behavior === 'COWARD') {
    desiredVelocity = Burner.Vector.VectorSub(this.target.location, this.location);
    distanceToTarget = desiredVelocity.mag();
    desiredVelocity.normalize();

    m = distanceToTarget/agent.maxSpeed;
    desiredVelocity.mult(-m);

    desiredVelocity.sub(agent.velocity);
    desiredVelocity.limit(agent.maxSteeringForce);

    return desiredVelocity;
  }
  return new Burner.Vector();
};