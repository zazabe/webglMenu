(function($){
var Utils = {
	rad2deg: function(rad){
		return rad*(180/Math.PI);
	},
	deg2rad: function(deg){
		return deg*(Math.PI/180);
	}
};
	
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
	    	row: 12,
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
	    	speed: 2,
	    	duration: 1000
	    },
	    
	    current: {x: 0, y: 0, z: 0}
	}, options);
	
	this.target = target;	
	this.elements = elements;
	this.objects = [];
	
	this.checkConfig();
	this.createScene();
	
	if(this.opt.debug){
		this.debug();
	}
	
	this.createElements();
	this.listenEvents();
	this.render();
	this.animate();
	
	this.selectElement(0,0, 1000);
};	


WebGlMenu.prototype = {
	setOption: function(def, option){
		this.opt = $.extend(def, option);
	},
	
	createScene: function(){
		this.scene  = new THREE.Scene();
		this.projector = new THREE.Projector();
		
		this.setLight();
		this.setCamera();
				
		this.scene.add(this.camera);
		this.scene.add(this.light.ambient);
		//this.scene.add(this.light.spot);
		this.scene.add(this.light.point);
		
	},
	
	setCamera: function(){
		var camera = new THREE.MenuCamera({
			distance: (this.opt.element.radius * 2) - 10,
			fov: 45,
			aspect: (this.opt.screen.width / this.opt.screen.height),
			near: 0.1,
			far: 2000,
			looklight: this.light.point
		});
		camera.position.set(0, 0, 150);
		this.camera = camera;
	},
	
	setLight: function(){
		var spotPosition = this.opt.light.spot.position;
		var spot = new THREE.SpotLight( this.opt.light.spot.color, 1 );
		
		spot.position.set(spotPosition.x, spotPosition.y, spotPosition.z);		
		
		var point = new THREE.PointLight( 0xffffff, 1.4, 100 );
		
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
		TWEEN.update();
		
		this.renderer.render(this.scene, this.camera);
		
		if(this.opt.debug){
			this.debugRender();
		}
	},
	
	
	createElements: function(){
		for(var index=0 ; index < this.elements.length ; index++){
			this.add(this.elements[index], index);
		}
	},
	
	listenEvents: function(){
		var menu = this;
			
		var events = {
			swipe:     false,
			zoom:      false,
			press:     false,
			start:    {x: 0, y: 0},
			current:  {x: 0, y: 0},
			end:      {x: 0, y: 0},
			distance: 0,
			
			start: function(e){
				if( e.originalEvent.touches.length <= 1){
					e.preventDefault();
					if(e.button == 0){
						events.press = true;
					}
					events.set('start', e);
					events.set('current', e);
				}
			},
			move: function(e){
				if( e.originalEvent.touches.length <= 1){
					e.preventDefault();
					if((events.swipe || events.zoom) && events.press){
						events.set('current', e);
						events.distance = events.getDistance();
						events.set('start', e);
						
						if(events.swipe){
							events.doSwipe();
						}
						if(events.zoom){
							events.doZoom();
						}
					}
				}
			},
			end: function(e){
				if( e.originalEvent.touches.length <= 1){
					e.preventDefault();
					events.set('end', e);
					events.set('current', e);
					events.set('start', e);
					events.distance = 0;
					if(e.button == 0){
						events.press = false;
					}
				}
			},
			doSwipe: function(){
				menu.swipe(this.distance);
			},
			doZoom: function(){
				menu.zoom(this.distance);
			},
			set: function(type, event){
				this[type] = {
					x: event.clientX,
					y: event.clientY
				};
			},
			getDistance: function(){
				var positive = (this.start.x - this.current.x) < 0 ? false : true;
				var distance = Math.floor((Math.sqrt(Math.pow(this.start.x - this.current.x, 2) + Math.pow(this.start.y - this.current.y, 2)))*10)/10;
				distance = (positive && distance < 0) || (!positive && distance > 0) ? -distance : distance;
				return distance;
			}
		};
		

		//simulate zoom, move event
		if(!Modernizr.touch){
			$(window).bind('mouseup', function(e){
				e.preventDefault();
				if(events.swipe){
					var object = null, x = 0, y = 0, inc = 0.01, positive = true, test = 0; 
					while(object == null){
						object = menu.getElementAtPosition(x, y);
						x += positive ? inc : -inc; y +=  positive ? inc : -inc;
						if(x > 100 || y > 100) {
							positive = false;
						}
						if(x < -100 || y < -100) {
							positive = true;
						}
						if(++test > 10000){
							throw new Error('can not autodetect closest element...');
						}
					}
					menu.camera.look.object = object;
					menu.selectElement(x,y, 300);
					
				}
			});
			
			$(window).bind('keydown', function(e){
				switch( e.keyCode) {
					case 81: /*q*/ events.swipe = true; break;
					case 87: /*w*/ events.zoom = true; break;
				}
			});
			$(window).bind('keyup', function(e){
				switch( e.keyCode) {
					case 81: /*q*/ events.swipe = false; break;
					case 87: /*w*/ events.zoom = false; break;
				}
			});
			
			$(this.target).bind('mousedown', events.start);
			$(this.target).bind('mousemove', events.move);
			$(this.target).bind('mouseup', events.end);
		} 
		else {
			// handle touch event for zoom and move 
			$(this.target).bind('touchstart', events.start);
			$(this.target).bind('touchmove', events.move);
			$(this.target).bind('touchend', events.end);
			
			$(this.target).hammer({prevent_default:true}).bind('transformstart', function(e){
				events.swipe = false;
				events.zoom = true;
			});
			
			var scale = 1;
			$(this.target).hammer({prevent_default:true}).bind('transform', function(e){
				events.distance = scale - e.scale;
				events.doZoom();
			});
			
			$(this.target).hammer({prevent_default:true}).bind('transformend', function(e){
				menu.mouse.swipe = false;
				menu.mouse.zoom = false;
			});
			
			var oldDistance = null;
			//select element
			$(this.target).bind('touchstart',  function(e){
				if(events.distance == 0 && e.originalEvent.touches.length <= 1){
					
					var x = ( e.originalEvent.touches[0].clientX / window.innerWidth ) * 2 - 1,
					    y = - ( e.originalEvent.touches[0].clientY / window.innerHeight ) * 2 + 1;
					var object = menu.getElementAtPosition(x, y);
					
					if(menu.camera.look.distance <= 40 && object && object.scale.x > 1){
						console.log('unzoom', oldDistance);
						menu.camera.distanceToElement(oldDistance, 1000);
						menu.camera.look.distance = oldDistance;
					}
					else if(object && object.scale.x > 1){
						console.log('zoom');
						oldDistance = menu.camera.look.distance;
						menu.enterElement(x, y);
					}
					else {
						menu.selectElement(x, y, menu.opt.move.duration, true);
					}
				}
				
			
			});
			
				
		}
		
		
		
		
		
	},
	
	enterElement: function(x, y){
		var object = this.getElementAtPosition(x, y), menu = this;
		if(object){
			this.camera.distanceToElement(40, menu.opt.move.duration, function(){
				this.look.distance = 40;
				menu.trigger('webglmenu:enter-element', [menu, object]);
			});
		}
	},
	
	selectElement: function(x, y, duration, force){
		force = force || false;
		var object = this.getElementAtPosition(x, y), menu = this;
		if(object){
			this.camera.moveTo(object, duration || this.opt.move.duration, function(){
				menu.trigger('webglmenu:select-element', [menu, object]);
				for(var index in menu.objects){
					if(menu.objects[index].scale.x != 1){
						menu.objects[index].scaleTo(1, 1, 1, 200);
					}
						
				}
				this.look.object.scaleTo(1.1,1.1,1.1, 200);
			}, force);
		}
	},
	
	zoom: function(distance){
		var distance = this.camera.look.distance + distance;
		if(distance > 50 && distance < (this.opt.element.radius * 2) - 10){
			this.camera.distanceToElement(distance);
		}
	},
	
	swipe: function(degree){
		
		var object = this.camera.look.object,
		    current = object.position.clone(),
		    angle = this.camera.look.angle + Utils.deg2rad(degree),
			lookat = new THREE.Vector3(
				this.opt.element.radius * Math.cos(angle),
				current.y,
				-(this.opt.element.radius * Math.sin(angle))
		);
		
		this.camera.lookAt(lookat);
		this.camera.look.position = lookat;
		this.camera.look.angle = angle;
		
		this.camera.position.set(
				(this.opt.element.radius - this.camera.look.distance) * Math.cos(angle),
				this.camera.position.y,
				-(this.opt.element.radius - this.camera.look.distance) * Math.sin(angle)
		);
		
		this.light.point.position.set(
			(this.opt.element.radius - 30) * Math.cos(angle),
			this.camera.position.y,
			-(this.opt.element.radius - 30) * Math.sin(angle)
		);
	},
	
	moveForward: function(){
		var distance = this.camera.look.distance - this.opt.move.speed;
		
		console.log('moveForward', distance);
		if(distance > 50){
			this.camera.distanceToElement(distance);
		}
	},
	
	moveBackward: function(){
		var distance = this.camera.look.distance + this.opt.move.speed;
		
		console.log('moveBackward', distance);
		if(distance < (this.opt.element.radius * 2) - 10){
			this.camera.distanceToElement(distance);
		}
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

	getElementAtPosition: function(x, y){
		var vector = new THREE.Vector3( x, y, 1 );
		this.projector.unprojectVector(vector, this.camera);
		var ray = new THREE.Ray( this.camera.position, vector.subSelf(this.camera.position).normalize() );
		var intersects = ray.intersectObjects( this.scene.children );
		return intersects.length > 0 ? intersects[0].object : null;
	},
	
	add: function(object, index){
		var element = this.createCubeMesh(this.opt.element.width, this.opt.element.height, this.opt.element.thickness, this.opt.element.color, object.material.url);
		
		var radius = this.opt.element.radius,
		    nb =  (index % this.opt.grid.row),
		    angle = Utils.deg2rad(this.opt.element.angle * nb);

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
		if(!Modernizr.webgl){
			throw new Error('Your browser doesn\'t support WebGL');
		}
		
		if(!(typeof THREE == 'object' && THREE.REVISION >= 48)){
			throw new Error('THREE.js is not included or is an old version (>48)');
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
		return mesh;
	},
	
	trigger: function(event, args){
		console.log('trigger', event);
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
			try {
				instance = new menu(this, elements, options);
			}
			catch(e){
				console.log(e);
				el.append($('<div>')
				  .html('WebGLMenu plugin:' + "<br /><b>" + e.message + "</b>")
				  .css({
					  background: '#ddaaaa', 
					  color: '#880000', 
					  border: '2px solid #660000', 
					  borderRadius: '5px', 
					  width: '300px', 
					  textAlign: 'center', 
					  lineHeight: '40px',   
					  padding: '2px 3px', 
					  margin: '5px auto'
				}));
			}
			el.data('WebGlMenu', instance);
		}
	});
	return instance;
}	
	

	

})(jQuery)