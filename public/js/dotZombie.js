(function(window, document) {
	var Utils = Flora.Utils,
	Mover = Flora.Mover;

function Animal(opt_options) {
  var options = opt_options || {};
  options.name = options.name || 'Animal';
  Mover.call(this, options);
}
Utils.extend(Animal, Mover);

Animal.prototype.init = function(opt_options) {

  var options = opt_options || {};
  Animal._superClass.prototype.init.call(this, options);

  this.followMouse = !!options.followMouse;
  this.maxSteeringForce = typeof options.maxSteeringForce === 'undefined' ? 10 : options.maxSteeringForce;
  this.seekTarget = options.seekTarget || null;
  this.flocking = !!options.flocking;
  this.desiredSeparation = typeof options.desiredSeparation === 'undefined' ? this.width * 2 : options.desiredSeparation;
  this.separateStrength = typeof options.separateStrength === 'undefined' ? 0.3 : options.separateStrength;
  this.alignStrength = typeof options.alignStrength === 'undefined' ? 0.2 : options.alignStrength;
  this.cohesionStrength = typeof options.cohesionStrength === 'undefined' ? 0.1 : options.cohesionStrength;
  this.flowField = options.flowField || null;
  this.sensors = options.sensors || [];

  this.color = options.color || [197, 177, 115];
  this.borderWidth = options.borderWidth || 0;
  this.borderStyle = options.borderStyle || 'none';
  this.borderColor = options.borderColor || 'transparent';
  this.borderRadius = options.borderRadius || this.sensors.length ? 100 : 0;

  //

  this.separateSumForceVector = new Burner.Vector(); // used in Agent.separate()
  this.alignSumForceVector = new Burner.Vector(); // used in Agent.align()
  this.cohesionSumForceVector = new Burner.Vector(); // used in Agent.cohesion()
  this.followTargetVector = new Burner.Vector(); // used in Agent.applyForces()
  this.followDesiredVelocity = new Burner.Vector(); // used in Agent.follow()

  //

  Burner.System.updateCache(this);
};

Animal.prototype.applyForces = function() {

  var i, max, sensorActivated, sensor, r, theta, x, y;

  if (this.sensors.length > 0) { // Sensors
    for (i = 0, max = this.sensors.length; i < max; i += 1) {

      sensor = this.sensors[i];

      r = sensor.offsetDistance; // use angle to calculate x, y
      theta = Utils.degreesToRadians(this.angle + sensor.offsetAngle);
      x = r * Math.cos(theta);
      y = r * Math.sin(theta);

      sensor.location.x = this.location.x;
      sensor.location.y = this.location.y;
      sensor.location.add(new Burner.Vector(x, y)); // position the sensor

      if (i) {
        sensor.borderStyle = 'none';
      }

      if (sensor.activated) {
        this.applyForce(sensor.getActivationForce(this));
        sensorActivated = true;
      }

    }
  }

  if (this.seekTarget) { // seek target
    this.applyForce(this._seek(this.seekTarget));
  }

  if (this.flocking) {
    this.flock(Burner.System.getAllItemsByName(this.name));
  }

  return this.acceleration;
};

/**
 * Bundles flocking behaviors (separate, align, cohesion) into one call.
 *
 * @returns {Object} This object's acceleration vector.
 */
Animal.prototype.flock = function(elements) {

  this.applyForce(this.separate(elements).mult(this.separateStrength));
  this.applyForce(this.align(elements).mult(this.alignStrength));
  this.applyForce(this.cohesion(elements).mult(this.cohesionStrength));
  return this.acceleration;
};

/**
 * Loops through a passed elements array and calculates a force to apply
 * to avoid all elements.
 *
 * @param {array} elements An array of Flora elements.
 * @returns {Object} A force to apply.
 */
Animal.prototype.separate = function(elements) {

  var i, max, element, diff, d,
  sum, count = 0, steer;

  this.separateSumForceVector.x = 0;
  this.separateSumForceVector.y = 0;
  sum = this.separateSumForceVector;

  for (i = 0, max = elements.length; i < max; i += 1) {
    element = elements[i];
    if (this.className === element.className && this.id !== element.id) {

      d = this.location.distance(element.location);

      if ((d > 0) && (d < this.desiredSeparation)) {
        diff = Burner.Vector.VectorSub(this.location, element.location);
        diff.normalize();
        diff.div(d);
        sum.add(diff);
        count += 1;
      }
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxSpeed);
    sum.sub(this.velocity);
    sum.limit(this.maxSteeringForce);
    return sum;
  }
  return new Burner.Vector();
};

/**
 * Loops through a passed elements array and calculates a force to apply
 * to align with all elements.
 *
 * @param {array} elements An array of Flora elements.
 * @returns {Object} A force to apply.
 */
Animal.prototype.align = function(elements) {

  var i, max, element, d,
    neighbordist = this.width * 2,
    sum, count = 0, steer;

  this.alignSumForceVector.x = 0;
  this.alignSumForceVector.y = 0;
  sum = this.alignSumForceVector;

  for (i = 0, max = elements.length; i < max; i += 1) {
    element = elements[i];
    d = this.location.distance(element.location);

    if ((d > 0) && (d < neighbordist)) {
      if (this.className === element.className && this.id !== element.id) {
        sum.add(element.velocity);
        count += 1;
      }
    }
  }

  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxSpeed);
    sum.sub(this.velocity);
    sum.limit(this.maxSteeringForce);
    return sum;
  }
  return new Burner.Vector();
};

/**
 * Loops through a passed elements array and calculates a force to apply
 * to stay close to all elements.
 *
 * @param {array} elements An array of Flora elements.
 * @returns {Object} A force to apply.
 */
Animal.prototype.cohesion = function(elements) {

  var i, max, element, d,
    neighbordist = 10,
    sum, count = 0, desiredVelocity, steer;

  this.cohesionSumForceVector.x = 0;
  this.cohesionSumForceVector.y = 0;
  sum = this.cohesionSumForceVector;

  for (i = 0, max = elements.length; i < max; i += 1) {
    element = elements[i];
    d = this.location.distance(element.location);

    if ((d > 0) && (d < neighbordist)) {
      if (this.className === element.className && this.id !== element.id) {
        sum.add(element.location);
        count += 1;
      }
    }
  }

  if (count > 0) {
    sum.div(count);
    sum.sub(this.location);
    sum.normalize();
    sum.mult(this.maxSpeed);
    sum.sub(this.velocity);
    sum.limit(this.maxSteeringForce);
    return sum;
  }
  return new Burner.Vector();
};

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

function SensorSheep(opt_options) {
  var options = opt_options || {};
  options.name = options.name || 'SensorSheep';
  Mover.call(this, options);
}
Utils.extend(SensorSheep, SensorAnimal);

/**
 * Called every frame, step() updates the instance's properties.
 */
SensorSheep.prototype.step = function() {

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
};var totalSheep = 175,
	totalWolves = 1;

Burner.Classes.Animal = Animal;
Burner.Classes.SensorWolf = SensorWolf;
Burner.Classes.SensorSheep = SensorSheep;



var world = new Burner.World(document.body, {
    gravity: new Burner.Vector(),
    c: 0
});

Burner.System.init( function () {
	var system = this;
	var i;
	var getRandomNumber = Flora.Utils.getRandomNumber;
	var windowSize = Flora.Utils.getWindowSize();

	
	var target = this.add('Walker',{
		wrapWorldEdges: false,
		maxSpeed: 2

	});
	
	var onCollision = function() {
		console.log('COLLIDED', arguments);
	};


	for(i = 0; i < totalSheep; i++) {
		this.add('Animal', {
			name: 'Sheep',
			width: 10,
			height: 10,
			location: new Burner.Vector(getRandomNumber(0, world.width), getRandomNumber(0, world.height)),
			checkWorldEdges: true,
			wrapWorldEdges: false,
			avoidWorldEdges: true,
			avoidWorldEdgesStrength:10,
			cohesionStrength: 0.1,
			flocking: true,
			maxSpeed: 5,
			maxSteeringForce: 5,
			//seekTarget: target,
			alignStrength: 0.1,
			sensors: [
				system.add('SensorWolf', {
					type: 'wolf',
					behavior: 'COWARD',
					sensitivity: 3,
					offsetDistance: 0
				})
			],
		});
	}


	var wolfStep = function() {
		var j, max;
		var sheep = Burner.System._caches.Sheep;
		if (sheep) {
			max = sheep.list.length;
			for(j = 0;  j < max; j++) {
				if(sheep.lookup[sheep.list[j].id]) {
					if (this.isInside(sheep.list[j])) {
						collide.call(this,sheep.list[j]);
					}
				}
			}
		}
	};


	var collide = function(sheep) {
		console.log("caught sheep:", sheep);
		system.add('Animal', {
			name: 'Wolf',
			color: [255,100,0],
			width: 10, 
			height: 10,
			wrapWorldEdges: true,
			location: sheep.location,
			maxSpeed: 20,
			maxSteeringForce: 20,
			flocking: true,
			avoidWorldEdges: true,
			avoidWorldEdgesStrength:10,
			sensors: [
				system.add('SensorSheep', {
					type: 'sheep',
					behavior: 'AGGRESSIVE',
					sensitivity: 20,
					offsetDistance: 0
				})
			],
			beforeStep: wolfStep
		});

		if(sheep.sensors.length > 0)
			system.destroyItem(sheep.sensors[0]);

		system.destroyItem(sheep);
	};

	for(i = 0; i < totalWolves; i++) {
		this.add('Animal', {
			name: 'Wolf',
			color: [255,100,0],
			width: 10, 
			height: 10,
			flocking: true,
			wrapWorldEdges: true,
			avoidWorldEdges: true,
			avoidWorldEdgesStrength: 100,
			maxSpeed: 20,
			
			sensors: [
				this.add('SensorSheep', {
					type: 'sheep',
					behavior: 'AGGRESSIVE',
					sensitivity: 20				
				})
			],
			beforeStep: wolfStep
		});
	}


    
}, world);})(window, document);