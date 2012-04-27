/**
 * @author zazabe
 * 
 * Modified version of PerspectiveCamera
 * 
 * @author mr.doob / http://mrdoob.com/
 * @author greggman / http://games.greggman.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

THREE.Vector3.prototype.getValue = function(){
	return {
		x: this.x,
		y: this.y,
		z: this.z
	};
};

THREE.MenuCamera = function ( fov, aspect, near, far ) {
	THREE.Camera.call( this );

	this.look = {
		distance: 100,
		object: null
	};
	
	this.fov = fov !== undefined ? fov : 50;
	this.aspect = aspect !== undefined ? aspect : 1;
	this.near = near !== undefined ? near : 0.1;
	this.far = far !== undefined ? far : 2000;

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
	console.log(this.look);
};


THREE.MenuCamera.prototype.moveTo = function(object, duration){
	
	
	var move = {
		eye: {
			from  : this.look.object.getPositionAt(this.look.distance).getValue(),
			to    : object.getPositionAt(this.look.distance).clone().getValue(),
			tween : null
		},
		look: {
			from  : this.look.object.position.clone().getValue(),
			to    : object.position.clone().getValue(),
			tween : null
		}
	};
	var camera = this;
	this.look.object = object;
	var eyeTween = new TWEEN.Tween(move.eye.from).to(move.eye.to, duration).easing(TWEEN.Easing.Exponential.Out);
	eyeTween.onUpdate(function(){
		camera.position.set(move.eye.from.x, move.eye.from.y, move.eye.from.z);
	});
	
	var lookTween = new TWEEN.Tween(move.look.from).to(move.look.to, duration).easing(TWEEN.Easing.Exponential.Out);
	lookTween.onUpdate(function(){
		camera.lookAt(new THREE.Vector3(move.look.from.x, move.look.from.y, move.look.from.z));
	});
	
	var complete = 0;
	var atCompletion = function(){
		
	};
	eyeTween.onComplete(atCompletion);
	lookTween.onComplete(atCompletion);
	
	eyeTween.start();
	lookTween.start();
};

