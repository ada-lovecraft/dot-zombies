

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

