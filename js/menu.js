(function($){

	
var WebGlMenu = function(target, elements, options){
	this.setOption({
		screen: {
		    color:  0xffffff,
			width:  800,
			height: 600
	    },
	    light: {
	    	color: 0xffffff
	    },
	    grid: {
	    	row: 10,
	    	margin: 10
	    },
	    element: {
	    	color: 0x000000,
	    	width: 50,
	    	height: 33,
	    	thickness: 5
	    },
	    current: {x: 0, y: 0, z: 0}
	}, options);
	
	console.log(this.opt);
	
	this.target = target;	
	this.elements = elements;
	
	this.checkConfig();
	this.createScene();
	this.createElements();
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
		
		this.camera.position.z = 300;
		console.log(this.scene);
	},
	
	render: function(){
		this.renderer = new THREE.WebGLRenderer( { clearColor: this.scene.color, clearAlpha: 1 } );
	 	this.renderer.setSize(this.opt.screen.width, this.opt.screen.height);
		this.target.appendChild( this.renderer.domElement );
		
		console.log(this.renderer);
	},
	
	animate: function(){
		var that = this;
		requestAnimationFrame( function(){
			that.animate();
		});
		this.tick();
	},
	
	tick: function(){
		this.renderer.render(this.scene, this.camera);
	},
	
	createElements: function(){
		for(var index=0 ; index < this.elements.length ; index++){
			this.add(this.elements[index], index);
		}
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
		
		element.position = {x: (index * (this.opt.element.width + this.opt.grid.margin)), y: 0, z: 0};
		this.scene.add(element);
	},
	
	checkConfig: function(){
		if(!(typeof THREE == 'object' && THREE.REVISION >= 48)){
			throw new Error('THREE.js is not included or it is an old version (>48)');
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