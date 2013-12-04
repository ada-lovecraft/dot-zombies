var totalSheep = 100,
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
			location: new Burner.Vector(getRandomNumber(0, world.width), getRandomNumber(0, world.height)),
			flocking: true,
			avoidWorldEdges: true,
			avoidWorldEdgesStrength: 100,
			sensors: [
				system.add('SensorWolf', {
					type: 'wolf',
					behavior: 'COWARD',
					sensitivity: 10,
					offsetDistance: -20
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
		var location = sheep.location;
		if(sheep.sensors.length > 0)
			system.destroyItem(sheep.sensors[0]);

		system.destroyItem(sheep);
		console.log("caught sheep:", sheep);
		system.add('Animal', {
			name: 'Wolf',
			color: [89,207,78],
			flocking: true,
			location: location,
			desiredSeparation: 50,
			separateStrength: 2,
			alignStrength: 0.01,
			cohesionStrength: 0.01,
			wrapWorldEdges: true,
			sensors: [
				system.add('SensorSheep', {
					type: 'sheep',
					behavior: 'AGGRESSIVE',
					sensitivity: 7,
					offsetDistance: -20
				})
			],
			beforeStep: wolfStep
		});

		
	};

	for(i = 0; i < totalWolves; i++) {
		var wolf = this.add('Animal', {
			name: 'Wolf',
			color: [89,207,78],
			flocking: true,		
			desiredSeparation: 50,
			separateStrength: 2,
			alignStrength: 0.01,
			cohesionStrength: 0.01,
			wrapWorldEdges: true,
			sensors: [
				this.add('SensorSheep', {
					type: 'sheep',
					behavior: 'AGGRESSIVE',
					sensitivity: 10,
					offsetDistance: -10
				})
			],
			beforeStep: wolfStep

		});
		console.log('max speed:', wolf.maxSpeed);
		console.log('max steering:', wolf.maxSteeringForce);
	}



	this.add('InputMenu', {
      opacity: 0.4,
      borderColor: 'transparent',
      position: 'bottom center'
    });



    
}, world);