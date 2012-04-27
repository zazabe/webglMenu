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
	    	ambient: { color: 0x505050 },
	    	spot:    { color: 0xffffff, position: {x: 0, y: 500, z: 2000 }, shadow: true }
	    	
	    },
	    
	    grid: {
	    	row: 6,
	    	margin: 10
	    },
	    
	    element: {
	    	color: 0xffffff,
	    	width: 50,
	    	height: 33,
	    	thickness: 1,
	    	angle: 30,
	    	radius: 100
	    },
	    
	    move: {
	    	duration: 1000
	    },
	    
	    current: {x: 0, y: 0, z: 0}
	}, options);
	
	console.log(this.opt);
	
	this.target = target;	
	this.elements = elements;
	this.objects = [];
	
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
		this.projector = new THREE.Projector();
		
		this.setCamera();
		this.setLight();
				
		this.scene.add(this.camera);
		this.scene.add(this.light.ambient);
		this.scene.add(this.light.spot);
		//this.scene.add(this.light.point);
		
	},
	
	setCamera: function(){
		var camera = new THREE.MenuCamera(45, this.opt.screen.width / this.opt.screen.height, 0.1, 10000);
		camera.position.set(0, 0, 150);
		this.camera = camera;
		console.log(camera);
	},
	
	setLight: function(){
		var spotPosition = this.opt.light.spot.position;
		var spot = new THREE.SpotLight( this.opt.light.spot.color, 1 );
		
		spot.position.set(spotPosition.x, spotPosition.y, spotPosition.z);		
		
		var point = new THREE.PointLight( 0xffffff, 2, 150 );
		
		this.light  = {
			ambient: new THREE.AmbientLight( this.opt.light.ambient.color ),
			spot: spot,
			point: point
		};
		
			
	},
	
	render: function(){
		var canvas = $('<canvas>');
		$(this.target).append(canvas);
		this.canvas = canvas.get(0);
		this.renderer = new THREE.WebGLRenderer( { canvas: this.canvas, clearColor: this.scene.color, clearAlpha: 1, antialias: true } );
	 	this.renderer.setSize(this.opt.screen.width, this.opt.screen.height);
	 	this.target.appendChild( this.renderer.domElement );
	},
	
	animate: function(){
		var inst = this;
		requestAnimationFrame(function(){
			inst.animate();
		});
		this.tick();
	},
	
	tick: function(){
		this.movePointLight();
		TWEEN.update();
		
		this.renderer.render(this.scene, this.camera);
		
		if(this.opt.debug){
			this.debugRender();
		}
	},
	
	movePointLight: function(){
		if(this.camera.look.object){
			this.light.point.position = this.camera.look.object.getPositionAt(40);
		}	
		
	},
	
	createElements: function(){
		for(var index=0 ; index < this.elements.length ; index++){
			this.add(this.elements[index], index);
		}
	},
	
	listenEvents: function(){
		this.mouse = { status: 'up', start: { x: 0, y:0 }, position: { x: 0, y:0 }, diff: { x: 0, y:0 }};
		var mouse = this.mouse,
		    projector = this.projector,
		    camera = this.camera,
		    scene = this.scene,
		    opt = this.opt;
		
		
		$(this.target).bind('click', function(e){
			event.preventDefault();

			mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
			mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
			
			var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
			projector.unprojectVector(vector, camera);
			var ray = new THREE.Ray( camera.position, vector.subSelf(camera.position).normalize() );
			var intersects = ray.intersectObjects( scene.children );
			if ( intersects.length > 0 ) {
				camera.moveTo(intersects[0].object, opt.move.duration);
			} 
		});
		
	},
	
	go: function(id){
		this.moveTo(this.objects[id], this.opt.move.duration);
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
		var element = this.createCubeMesh(this.opt.element.width, this.opt.element.height, this.opt.element.thickness, this.opt.element.color, object.material.url);
		
		var radius = this.opt.element.radius,
		    nb =  (index % this.opt.grid.row),
		    angle =  this.opt.element.angle * nb * (Math.PI/180);

		element.position.set(
		 	 radius * Math.cos(angle),
			 -((Math.floor(index / this.opt.grid.row) * (this.opt.element.height + this.opt.grid.margin))), 
			 - (radius * Math.sin(angle))
		);
		
		element.angle = angle;
		element.radius = radius;
		
		element.lookAt(new THREE.Vector3(0, element.position.y, 0));
		
		if(index == 0){
			this.camera.lookTo(element);
		}
		
		
		
		this.objects[index] = element;
		this.scene.add(element);
	},
	
	checkConfig: function(){
		if(!(typeof THREE == 'object' && THREE.REVISION >= 48)){
			throw new Error('THREE.js is not included or it is an old version (>48)');
		}
	},
	

	createCubeMesh: function(width, height, thickness, color, image){
		var geometry = new THREE.CubeGeometry(width, height, thickness);
		var materialOption = { color: color};
		if(image){
			 var texture = THREE.ImageUtils.loadTexture(image);
			 texture.repeat.set(1, 1);
			 texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			 materialOption.map = texture;
		}
		var material = new THREE.MeshLambertMaterial(materialOption);
		
		var mesh = new THREE.Mesh(geometry, material);
		mesh.angle = 0;
		mesh.radius = 0;
		
		mesh.getPositionAt = function(distance){
			return new THREE.Vector3(
				(this.radius - distance) * Math.cos(this.angle),
				this.position.y, 
				- ((this.radius - distance) * Math.sin(this.angle))	
			);
		};
		return mesh;
	}
};
	
	



/******************************************************************************************
 * DEBUG MODE
 *************************************************************************************************/


WebGlMenu.prototype.debug = function(){
	
	
	this.debug = { mouse: { mode: 'position' } };
	var debug = this.debug;
	
	
	
	//axes
	this.debug.axes = {
		x: this.createCubeMesh(100, 1, 1, 0x990000),
		y: this.createCubeMesh(1, 100, 1, 0x009900),
		z: this.createCubeMesh(1, 1, 100, 0x000099)
	};
	
	this.debug.axes.x.position.set(50, 0, 0);
	this.debug.axes.y.position.set(0, 50, 0);
	this.debug.axes.z.position.set(0, 0, 50);
	
	this.scene.add(this.debug.axes.x);
	this.scene.add(this.debug.axes.y);
	this.scene.add(this.debug.axes.z);
	
	//camera spot
	this.debug.camera = {
		eye: this.createCubeMesh(20, 20, 20, 0x990000),
		look: this.createCubeMesh(20, 20, 20, 0x009900)
	};
	
	this.scene.add(this.debug.camera.eye);
	this.scene.add(this.debug.camera.look);
	
	
	// views
	this.debug.views = [
        { left: 0, fly: false, info: false, bottom: 0, width: 1, height: 1, background: { r: 0, g: 0, b: 0, a: 1 } },
        { left: 0.75, fly: true, remember: true, info: false, bottom: 0.75, width: 0.25, height: 0.25, eye: [ 350, -150, 400 ], at: [ 0, 0, 0 ], rotate: [0, 0, 0], background: { r: 0.4, g: 0.4, b: 0.4, a: 1 }}
        
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
		
		view.left   = Math.floor( this.opt.screen.width  * view.left );
		view.bottom = Math.floor( this.opt.screen.height * view.bottom );
		view.width  = Math.floor( this.opt.screen.width  * view.width );
		view.height = Math.floor( this.opt.screen.height * view.height );
		
		
		
		
		(function(inst, id, camera){
			$(window).unload(function(){
				inst.remember.position(id, camera.position);
				inst.remember.quaternion(id, camera.quaternion);
				console.log('update matrix in db', id);
			});	
		})(this, i, camera);
	
		
		if(!view.remember && view.eye){
			camera.position.x = view.eye[0];
			camera.position.y = view.eye[1];
			camera.position.z = view.eye[2];
		}
		
		if(!view.remember && view.rotate){
			camera.rotation.x = view.rotate[0];
			camera.rotation.y = view.rotate[1];
			camera.rotation.z = view.rotate[2];
		}
	
		
		if(i!=0){
			this.scene.add(camera);
		}
		
		view.camera = camera;
		
		if(view.info){
			view.info = new Debug.InfoPanel(view.camera, {x: 10, y: 10}, this.target);
		}
		if(view.fly){
			console.log('fly', i);
			view.control = new THREE.FlyControls( view.camera, this.canvas);
			view.control.domElement = this.target;
			view.control.movementSpeed = 30;
			view.control.rollSpeed = 0.05;
			view.control.autoForward = false;
			view.control.dragToLook = true;
		}
	}
	
	this.first = true;
};


WebGlMenu.prototype.debugRender = function(){
	//render cameras
	this.debug.camera.eye.position = this.camera.position.clone();
	
	
	for(var i=0; i < this.debug.views.length; ++i){
		view = this.debug.views[i];
		
		this.renderer.setViewport( view.left, view.bottom, view.width, view.height );
		this.renderer.setScissor( view.left, view.bottom, view.width, view.height );
		this.renderer.enableScissorTest (true);
		if(view.background){
			this.renderer.setClearColor( view.background, view.background.a );
		}
		
		view.camera.aspect = view.width / view.height;
		view.camera.updateProjectionMatrix();
		
		if(view.control){
			view.control.update(1);
		}
		
		if(this.first && i == 1 && view.remember && this.remember.hasPosition(i) && this.remember.hasQuaternion(i)){
			view.camera.position = this.remember.position(i).clone();
			view.camera.quaternion = this.remember.quaternion(i).clone();
		}
		
		this.renderer.render(this.scene, view.camera);
	}
	this.first = false;
};

WebGlMenu.prototype.remember = {
	position: function(i, position){
		return this._type('position', i, position);
	},
	quaternion: function(i, rotation){
		return this._type('quaternion', i, rotation);
	},
	
	hasPosition: function(i){
		return this._hasType('position', i);
	},
	hasQuaternion: function(i){
		return this._hasType('quaternion', i);
	},
	
	_type: function(type, i, object){
		if(object){
			this.set(i, type, 'x', object.x);
			this.set(i, type, 'y', object.y);
			this.set(i, type, 'z', object.z);
			if(type == 'quaternion'){
				this.set(i, type, 'w', object.w);
			}
			
		}
		var coor = this.get(i, type), obj = null;
		if(type == 'quaternion'){
			obj = new THREE.Quaternion(coor.x || 0, coor.y || 0, coor.z || 0, coor.w || 0);
			}
		else {
			obj =  new THREE.Vector3(coor.x || 0, coor.y || 0, coor.z || 0);
		}
		return obj;
	},
	
	_hasType: function(type, i){
		return this.has(i, type);
	},
	
	//localStorage handler
	storage: localStorage,
	prefix: 'webglmenu:debug:',
	set: function(i, type, name, value){
		var key = this.key(i), 
			data = this.getAll(i);
			
		data[type] = data[type] ? data[type] : {};
		data[type][name] = value;
		
		this.store(i, data);
	},
	
	get: function(i, type, name){
		var data = this.getAll(i), value = null;
		if(data[type]){
			value = name ? data[type][name] : data[type]; 
		}
		return value;
	},

	getAll: function(i){
		return this.has(i) ? this.retrieve(i) : {};
	},
	
	has: function(i, type){
		var item = this.retrieve(i);
		return (item && type) ? !!item[type] : !!item;
	},
	
	key: function(i){
		return this.prefix + ':' + i;
	},
	
	retrieve: function(i){
		var item = this.storage.getItem(this.key(i)), value = null;
		try {     value = JSON.parse(item); }
		catch(e){ value = null; }
		return value;
	},
	
	store: function(i, object){
		this.storage.setItem(this.key(i), JSON.stringify(object));
	}
	
};

Debug = {};
Debug.InfoPanel = function(object3D, position, target){
	this.check(object3D);

	console.log(object3D);
	
	this.object = object3D;
	this.target = $(target);
	
	this.createPanel(position);
	this.listenTicks();
};

Debug.InfoPanel.prototype = {
		
	createPanel: function(position){
		this.panel = $('<div>');
		this.panel.css({
			border: '1px solid #999',
			borderRadius: '5px',
			background: '#e5e5e5',
			padding: '2px',
			position: 'absolute',
			left: position.x + 'px',
			top: position.y + 'px',
			fontSize: '8px',
			opacity: 0.5
		});
		
		this.content = {
			ul: $('<ul id="' + this.getId() + '">'),
			li: {},
			attachList: function(){
				for(var name in this.li){
					this.ul.append(this.li[name]);
				}
			}
		};
		
		this.panel.append(this.content.ul);
		
		this.target.append(this.panel);
	},	
	
	display: function(){
		var update = false, str = '', properties = ['position', 'rotation', 'scale', 'up', 'quaternion'], name = null;
		for(var i in properties){
			name = properties[i];
			if(this.object[name]){
				str = name + ' = x: ' + (this.object[name].x ? this.object[name].x : 'none')
						   + ', y: ' + (this.object[name].y ? this.object[name].y : 'none')
						   + ', z: ' + (this.object[name].z ? this.object[name].z : 'none')
						   + ', w: ' + (this.object[name].z ? this.object[name].z : 'none');
				
				if(!this.content.li[name]){
					this.content.li[name] = $('<li>').addClass(name).css({
						padding: 0, margin: 0, listStyle: 'none'
					});
					update = true;
				}
				this.content.li[name].html(str);
			}
		}
		if(update){
			this.content.attachList();
		}
	},
	
	getId: function(){
		return 'debug_' + this.object.id; 
	},
	
	listenTicks: function(){
		var inst = this;
		requestAnimationFrame(function(){
			inst.listenTicks();
		});
		this.display();
	},
	
	check: function(object){
		return true;
		if(!(object instanceof THREE.MenuCamera)){
			throw new Error('object3D parameter is not an instance of THREE.MenuCamera');
		}
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