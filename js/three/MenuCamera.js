/**
 * @author zazabe
 * 
 * Modified version of PerspectiveCamera
 * 
 * @author mr.doob / http://mrdoob.com/
 * @author greggman / http://games.greggman.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

THREE.MenuCamera = function ( fov, aspect, near, far ) {

	THREE.Camera.call( this );

	this.fov = fov !== undefined ? fov : 50;
	this.aspect = aspect !== undefined ? aspect : 1;
	this.near = near !== undefined ? near : 0.1;
	this.far = far !== undefined ? far : 2000;

	this.updateProjectionMatrix();
	
	this.target = new THREE.MenuCamera.Target(this);

};

THREE.MenuCamera.prototype = new THREE.Camera();
THREE.MenuCamera.prototype.constructor = THREE.MenuCamera;

THREE.MenuCamera.prototype.setLens = function ( focalLength, frameHeight ) {
	frameHeight = frameHeight !== undefined ? frameHeight : 24;

	this.fov = 2 * Math.atan( frameHeight / ( focalLength * 2 ) ) * ( 180 / Math.PI );
	this.updateProjectionMatrix();
}

THREE.MenuCamera.prototype.setViewOffset = function ( fullWidth, fullHeight, x, y, width, height ) {

	this.fullWidth = fullWidth;
	this.fullHeight = fullHeight;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;

	this.updateProjectionMatrix();

};


THREE.MenuCamera.prototype.updateProjectionMatrix = function () {

	if ( this.fullWidth ) {

		var aspect = this.fullWidth / this.fullHeight;
		var top = Math.tan( this.fov * Math.PI / 360 ) * this.near;
		var bottom = -top;
		var left = aspect * bottom;
		var right = aspect * top;
		var width = Math.abs( right - left );
		var height = Math.abs( top - bottom );

		this.projectionMatrix = THREE.Matrix4.makeFrustum(
			left + this.x * width / this.fullWidth,
			left + ( this.x + this.width ) * width / this.fullWidth,
			top - ( this.y + this.height ) * height / this.fullHeight,
			top - this.y * height / this.fullHeight,
			this.near,
			this.far );

	} else {

		this.projectionMatrix = THREE.Matrix4.makePerspective( this.fov, this.aspect, this.near, this.far );

	}

};


THREE.MenuCamera.Target = function(camera){
	this.camera = camera;
	this.position = this.camera.position.clone();
	this.roundFactor = 0.01;
	this.option = {
		look: {
			time: 700
		},
		eye: {
			time: 1200
		},
		distance: 2,
		time: 700
	};
	
	this.reset();
};

THREE.MenuCamera.Target.prototype = {
	
	axeDiff: function(axe, position){
		return this.position[axe] - position[axe];
	},
	
	axeDistance: function(axe, position){
		return this.position[axe] > position[axe] ? this.position[axe] - position[axe] : position[axe] - this.position[axe];
	},
	
	distance: function(position){
		return this.camera.position.distanceTo(position);
	},
	
	step: function(){
		return Math.floor(this.distance(this.position) / this.option.distance);
	},
	
	increment: function(){
		return {
			x: this.axeDiff('x', this.camera.position) / this.step(),
			y: this.axeDiff('y', this.camera.position) / this.step()
		};
	},
	
	needToMove: function(currentPosition, type){
		var distance = {
			x:(Math.round((this.axeDistance('x', currentPosition)) * 10) / 10),
			y:(Math.round((this.axeDistance('y', currentPosition)) * 10) / 10)
		};
		
		return (0 < distance.x && !(distance.x < 0.09)) || (0 < distance.y && !(distance.y < 0.09));
	},
	
	set: function(obj, time){
		this.reset();
		this.position = obj.position.clone().round(this.roundFactor);
		
		this.camera.position.round(this.roundFactor);
		
		this.status.increment = this.increment();
		this.status.step = this.step();
		this.status.delay = this.step() * 2;
		
		this.time = time || this.option.time;
		
		console.group('start anim');
		console.log('look position', this.status.look.position.x, this.status.look.position.y, this.status.look.position.z, this.needToMove(this.status.look.position));
		console.log('eye position', this.camera.position.x, this.camera.position.y, this.camera.position.z, this.needToMove(this.camera.position));
		console.log('target', this.position.x, this.position.y, this.position.z);
		console.log('time', this.time);
		console.log('step', this.status.step);
		console.log('delay', this.status.delay);
		console.log('interval', this.status.increment.x, this.status.increment.y);
		
		
		this.move();
	},
	
	move: function(){
		this.status.look.timer = setInterval(function(inst){
			inst.moveLook();
			
			if(!inst.needToMove(inst.status.look.position, 'look')){
				clearInterval(inst.status.look.timer);
				inst.status.look.timer = null;
				
			}
		}, ((this.option.look.time / this.step()) - this.status.delay), this);
		
		setTimeout(function(inst){
			inst.status.eye.timer = setInterval(function(inst){
				inst.moveEye();
				if(!inst.needToMove(inst.camera.position, 'eye')){
					clearInterval(inst.status.eye.timer);
					inst.status.eye.timer = null;
					console.groupEnd();
				}
			}, (inst.option.eye.time / inst.step()), inst);
		}, 500, this);
	},
	
	moveEye: function(step){
		if(!this.needToMove(this.status.look.position)){
			this.camera.lookAt(this.position);
		}
		this.applyMovement(this.camera.position);
	},
	moveLook: function(step){
		this.applyMovement(this.status.look.position);
		this.camera.lookAt(this.status.look.position);
	},
	
	applyMovement: function(position){
		position.x = (this.axeDistance('x', position) > 0.5) ? position.x + this.status.increment.x : position.x; 
		position.y = (this.axeDistance('y', position) > 0.5) ? position.y + this.status.increment.y : position.y; 
		return position;
	},
	
	reset: function(){
		var lookPosition = null;
		
		if(this.hasLookStatus('timer')){clearInterval(this.status.look.timer);} 
		if(this.hasEyeStatus('timer')){clearInterval(this.status.eye.timer);}
		
		
		this.position = this.camera.position.clone().round(this.roundFactor);
		this.time = 0;
		this.status = {
			increment: {x:0, y:0},
			look: {
				timer: null,
				position: ((this.hasLookStatus('position')) ? this.status.look.position.round(this.roundFactor) : this.camera.position.clone().round(this.roundFactor)), 
			},
			eye: {
				timer: null
			}	
		};
		this.status.look.position.z = 0;
	},
	
	hasLookStatus: function(property){
		return this.hasStatus('look', property);
	},
	
	hasEyeStatus: function(property){
		return this.hasStatus('eye', property);
	},
	
	hasStatus: function(type, property){
		var check = false;
		if(property){
			check = !!(this.status && this.status[type] && this.status[type][property]);
		}
		else {
			check = !!(this.status && this.status[type]);
		}
		return check;
	}
	
};

THREE.Vector3.prototype.round = function(precision){
	this.x = (Math.round(this.x) * (1/precision)) / (1/precision);
	this.y = (Math.round(this.y) * (1/precision)) / (1/precision);
	this.z = (Math.round(this.z) * (1/precision)) / (1/precision);
	return this;
};
