var totalSheep = 175,
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


    
}, world);