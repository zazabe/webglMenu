(function($){

	
var WebGlMenu = function(target, elements, options){
	this.setOption({
		debug: true,
		screen: {
		    color:  0x000000,
			width:  window.innerWidth,
			height: window.innerHeight
	    },
	    light: {
	    	color: 0xffffff
	    },
	    grid: {
	    	row: 5,
	    	margin: 10
	    },
	    element: {
	    	color: 0xffffff,
	    	width: 50,
	    	height: 33,
	    	thickness: 1
	    },
	    current: {x: 0, y: 0, z: 0}
	}, options);
	
	console.log(this.opt);
	
	this.target = target;	
	this.elements = elements;
	
	this.checkConfig();
	this.createScene();
	
	if(this.opt.debug){
		console.log(this.opt.debug);
		this.debug();
	}
	
	this.createElements();
	
	this.listenEvents();
	
	this.render();
	this.animate();
};	


WebGlMenu.prototype = {
	setOption: function(def, option){
		this.opt = $.extend(def, option);
	},
	
	createScene: function(){
		this.scene  = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(45, this.opt.screen.width / this.opt.screen.height, 0.1, 10000);
		this.light  = new THREE.AmbientLight( this.opt.light.color );
		
		this.scene.add(this.camera);
		this.scene.add(this.light);
		
		this.camera.position = {
			x: 0,
			y: 0, 
			z: 300
		};
	},
	
	render: function(){
		var canvas = $('<canvas>');
		$(this.target).append(canvas);
		this.canvas = canvas.get(0);
		this.renderer = new THREE.WebGLRenderer( { canvas: this.canvas, clearColor: this.scene.color, clearAlpha: 1 } );
	 	this.renderer.setSize(this.opt.screen.width, this.opt.screen.height);
		this.target.appendChild( this.renderer.domElement );
	},
	
	animate: function(){
		var that = this;
		requestAnimationFrame( function(){
			that.animate();
		});
		this.tick();
	},
	
	tick: function(){
		this.debugRender();
		this.renderer.render(this.scene, this.camera);
	},
	
	createElements: function(){
		for(var index=0 ; index < this.elements.length ; index++){
			this.add(this.elements[index], index);
		}
	},
	
	listenEvents: function(){
		this.mouse = { status: 'up', start: { x: 0, y:0 }, position: { x: 0, y:0 }, diff: { x: 0, y:0 }};
		var mouse = this.mouse;
		
		$(this.target).bind('mousedown', function(e){ 
			mouse.status = 'down';
			mouse.start = {x: e.offsetX, y: e.offsetY};
		});
		$(this.target).bind('mouseup', function(e){ 
			mouse.status = 'up'; 
			mouse.diff   = {x: 0, y: 0};
			mouse.start  = {x: 0, y: 0};
		});
		
		$(this.target).bind('mousemove', function(e){
			if(mouse.status == 'down'){
				mouse.position = {x: e.offsetX, y: e.offsetY};
				mouse.diff     = {x: (mouse.position.x - mouse.start.x), y: (mouse.position.y - mouse.start.y)};
			}
		});
	},
	
	go: function(id){
		
	},
	
	next: function(){
		
	},
	
	previous: function(){
		
	},
	
	last: function(){
		
	},
	
	first: function(){
		
	},
	
	add: function(object, index){
		var geometry = new THREE.CubeGeometry(this.opt.element.width, this.opt.element.height, this.opt.element.thickness);
		var material = new THREE.MeshLambertMaterial( { color: this.opt.element.color });
		var element = new THREE.Mesh(geometry, material);
		
		element.position = {
			x: ((index % this.opt.grid.row) * (this.opt.element.width + this.opt.grid.margin)), 
			y: -((Math.floor(index / this.opt.grid.row)) * (this.opt.element.height + this.opt.grid.margin)), 
			z: 0
		};
		
		this.scene.add(element);
	},
	
	checkConfig: function(){
		if(!(typeof THREE == 'object' && THREE.REVISION >= 48)){
			throw new Error('THREE.js is not included or it is an old version (>48)');
		}
	},
	
	createCubeMesh: function(width, height, thickness, color){
		return new THREE.Mesh(new THREE.CubeGeometry(width, height, thickness), 
							  new THREE.MeshLambertMaterial({ color: color}));
	}
};
	
	



/**
 * DEBUG MODE
 */


WebGlMenu.prototype.debug = function(){
	this.debug = { mouse: { mode: 'position' } };
	var debug = this.debug;
	
	
	
	//axes
	this.debug.axes = {
		x: this.createCubeMesh(100, 1, 1, 0x990000),
		y: this.createCubeMesh(1, 100, 1, 0x009900),
		z: this.createCubeMesh(1, 1, 100, 0x000099)
	};
	
	this.scene.add(this.debug.axes.x);
	this.scene.add(this.debug.axes.y);
	this.scene.add(this.debug.axes.z);
	
	//camera spot
	this.debug.camera = {
		spot: this.createCubeMesh(10, 10, 10, 0x995555)
	};
	
	this.debug.camera.spot.position = this.camera.position;
	
	this.scene.add(this.debug.camera.spot );
	
	
	// views
	this.debug.views = [
        { left: 0, fly: true, bottom: 0, width: 0.5, height: 1, background: { r: 0, g: 0, b: 0, a: 1 } },
        { left: 0.5, fly: false, bottom: 0, width: 0.5, height: 0.5, eye: [ 400, -50, 150 ], up: [ 0, 0, 0 ], rotate: [0, 1, 0],  background: {  r: 0.3, g: 0.3, b: 0.3, a: 1 }},
        { left: 0.5, fly: false, bottom: 0.5, width: 0.5, height: 0.5, eye: [ 0, 0, 300 ], up: [ 0, 0, 0 ], rotate: [0, 0, 0], background: { r: 0.4, g: 0.4, b: 0.4, a: 1 }}
	];
	
	for(var i=0; i < this.debug.views.length; ++i){
		var view = this.debug.views[i], camera = null;
		//first view is the normal camera
		if(i==0){
			camera = this.camera;
		}
		else {
			camera = new THREE.PerspectiveCamera(45, this.opt.screen.width / this.opt.screen.height, 0.1, 10000);
		}
		
		if(view.eye){
			camera.position.x = view.eye[0];
			camera.position.y = view.eye[1];
			camera.position.z = view.eye[2];
		}
		if(view.up){
			camera.up.x = view.up[0];
			camera.up.y = view.up[1];
			camera.up.z = view.up[2];
		}
		if(view.rotate){
			camera.rotation.x = view.rotate[0];
			camera.rotation.y = view.rotate[1];
			camera.rotation.z = view.rotate[2];
		}
		
		if(i!=0){
			this.scene.add(camera);
		}
		
		view.camera = camera;
		
		if(view.fly){
			console.log('fly', i);
			view.control = new THREE.FlyControls( view.camera, this.canvas);
			view.control.domElement = this.target;
			view.control.movementSpeed = 0.05;
			view.control.rollSpeed = 0.0005;
			view.control.autoForward = false;
			view.control.dragToLook = true;
		}
	}
	console.log(this.debug);
};


WebGlMenu.prototype.debugRender = function(){
	//render cameras
	for(var i=0; i < this.debug.views.length; ++i){
		view = this.debug.views[i];
		
		var left   = Math.floor( this.opt.screen.width  * view.left );
		var bottom = Math.floor( this.opt.screen.height * view.bottom );
		var width  = Math.floor( this.opt.screen.width  * view.width );
		var height = Math.floor( this.opt.screen.height * view.height );
	
		this.renderer.setViewport( left, bottom, width, height );
		this.renderer.setScissor( left, bottom, width, height );
		this.renderer.enableScissorTest (true);
		if(view.background){
			this.renderer.setClearColor( view.background, view.background.a );
		}
		
		if(view.control){
			//view.control.update(1);
		}
		view.camera.aspect = width / height;
		view.camera.updateProjectionMatrix();
		this.renderer.render(this.scene, view.camera);
	}
};




$.fn.WebGlMenu = function(elements, options){
	var instance = null, menu = WebGlMenu;
	
	$(this).each(function(){
		var el = $(this);
		if(el.data('WebGlMenu') instanceof menu){
			instance = el.data('WebGlMenu');
		}
		else {
			instance = new menu(this, elements, options);
			el.data('WebGlMenu', instance);
		}
	});
	return instance;
}	
	
})(jQuery)