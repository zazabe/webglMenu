
THREE.Vector3.prototype.getValue = function(){
	return {
		x: this.x,
		y: this.y,
		z: this.z
	};
};


THREE.Object3D.prototype.scaleTo = function(x, y, z, duration, callback){
	var obj = this,
	    from = this.scale.getValue(),
		to = {x: x, y: y, z: z},
		tween = new TWEEN.Tween(from).to(to, duration);
	
	tween.onUpdate(function(){
		obj.scale.set(from.x, from.y, from.z);
	});
	tween.onComplete(function(){
		if(callback){
			callback.apply(obj);
		}
	});
	tween.start();
	
};

THREE.Object3D.prototype.getPositionAt = function(distance){
	return new THREE.Vector3(
		(this.radius - distance) * Math.cos(this.angle),
		this.position.y, 
		- ((this.radius - distance) * Math.sin(this.angle))	
	);
};

/**
 * @author zazabe
 * 
 * Modified version of PerspectiveCamera
 * 
 * @author mr.doob / http://mrdoob.com/
 * @author greggman / http://games.greggman.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */
THREE.MenuCamera = function ( options ) {
	THREE.Camera.call( this );

	
	this.opt = $.extend({
		//position, movement
		distance: 200,
		duration: 1000,
		easing: TWEEN.Easing.Exponential.Out,
		//camera
		fov: 50,
		aspect: 1,
		near: 0.1,
		far: 2000,
		looklight: null
	}, options);

	this.look = {
		distance: this.opt.distance,
		object: null,
		position: null,
		angle: 0
	};

	this.fov = this.opt.fov;
	this.aspect = this.opt.aspect;
	this.near = this.opt.near;
	this.far = this.opt.far;

	this.inAnim = false;
	
	this.updateProjectionMatrix();
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


THREE.MenuCamera.prototype.lookFrom = function (object, distance) {
	this.position = object.getPositionAt(distance);;
};

THREE.MenuCamera.prototype.lookTo = function(object){
	this.lookFrom(object, this.look.distance);
	this.lookAt(object.position);
	this.look.object = object;
	this.look.position = object.position.clone();
	this.look.angle = object.angle;
};


THREE.MenuCamera.prototype.moveTo = function(object, duration, callback, force){
	force = force || false;
	if(!this.inAnim || force){
		duration = duration || this.opt.duration;
		var move = {
			eye: {
				from  : this.look.object.getPositionAt(this.look.distance).getValue(),
				to    : object.getPositionAt(this.look.distance).clone().getValue()
			},
			look: {
				from  : this.look.position.getValue(),
				to    : object.position.clone().getValue()
			},
			light: {
				from  : this.look.object.getPositionAt(30).getValue(),
				to    : object.getPositionAt(30).clone().getValue()
			}
		};
		
		
		this.look.object = object;
		this.look.position = object.position.clone();
		this.look.angle = object.angle;
		this.animTo(move, duration, callback, force);
	}
};

THREE.MenuCamera.prototype.animTo = function(move, duration, callback, force){
	force = force || false;
	if(!this.inAnim || force){
	
		this.inAnim = true;
		
		var camera = this;
		var complete = 0;
		
		var atCompletion = function(){
			if(--complete <= 0){
				camera.inAnim = false;
				console.log('anim completed', camera.inAnim);
				if(callback){
					callback.apply(camera);
				}
			}
		};
		
		
		if(move.eye){
			complete++;
			var eyeTween = new TWEEN.Tween(move.eye.from).to(move.eye.to, duration).easing(this.opt.easing);
			eyeTween.onUpdate(function(){
				camera.position.set(move.eye.from.x, move.eye.from.y, move.eye.from.z);
			});
			eyeTween.onComplete(atCompletion);
			eyeTween.start();
		}
		if(move.look){
			complete++;
			
			var lookTween = new TWEEN.Tween(move.look.from).to(move.look.to, duration).easing(this.opt.easing);
			lookTween.onUpdate(function(){
				camera.lookAt(new THREE.Vector3(move.look.from.x, move.look.from.y, move.look.from.z));
			});
			lookTween.onComplete(atCompletion);
			lookTween.start();
		}
		if(move.light && this.opt.looklight){
			complete++;
			
			var lightTween = new TWEEN.Tween(move.light.from).to(move.light.to, duration).easing(this.opt.easing);
			lightTween.onUpdate(function(){
				camera.opt.looklight.position = new THREE.Vector3(move.light.from.x, move.light.from.y, move.light.from.z);
			});
			lightTween.onComplete(atCompletion);
			lightTween.start();
		}
	}
	
};


THREE.MenuCamera.prototype.distanceToElement = function(distance, duration, callback){
	duration = duration || 0;
	if(duration){
		
		this.animTo({
			eye: {
				from  : this.position.getValue(),
				to    : this.look.object.getPositionAt(distance).clone().getValue()
			}
		}, duration, callback );
	}
	else {
		this.look.distance = distance;
		this.position = this.look.object.getPositionAt(distance).clone();
		if(callback){
			callback.apply(this);
		}
	}
	
};
