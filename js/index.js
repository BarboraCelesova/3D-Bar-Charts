$(function() {

  ///////////////////////
  // Initial Variables //
  ///////////////////////

  // Values
  var tick = 0;
  var size = 0.25;

  var red = 0xff0000;
  var blue = 0x1176c5;
  var white = 0xf9f9f9;

  // Arrays
  var bar = [];
  var dataset;

  ///////////////////////
  // Initial Setup     //
  ///////////////////////

    init();

  function init() {
    initListeners();
    init3DScene();
  }

  function initListeners() {

    $(window).resize(onWindowResize);
  }

  function init3DScene() {

    // Setup Scene / Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 2000);

    camera.position.set(130, 100, 100);
    camera.lookAt(new THREE.Vector3(20, 40, 0));

    // Setup Renderer
    renderer = new THREE.WebGLRenderer({
      antialias: true
    });

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    $("#webGL-container").append(renderer.domElement);

      $.when($.ajax({
          url: 'dataset/baska.csv',
          dataType: 'text'
      }).done(parsingDataset)).then(init3DElements);
  }

  function init3DElements() {

      console.log(dataset);
    createFloor();
    //creating bars
    createBar(5, -10, red);
    createBar(5, -5, white);
    createBar(5, 0, blue);

    createLight();
  }

    function parsingDataset(data) {

        var lines = data.split("\n");
        var result = [];
        var headers = lines[0].split(",");
        for(var i = 1; i < lines.length; i++){
            var obj = {};
            var currentLine=lines[i].split(",");
            for(var j = 0; j < headers.length; j++){
                obj[headers[j]] = currentLine[j];
            }
            result.push(obj);
        }

        //console.log(JSON.stringify(result)); //JSON
        dataset = JSON.stringify(result); //JavaScript object
        console.log(dataset);
    }

  ///////////////////////
  // Interactions      //
  ///////////////////////

  function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ///////////////////////
  // Create Elements   //
  ///////////////////////

  function createLight() {

    var ambient = new THREE.AmbientLight(0x999999);
    var spot = new THREE.SpotLight({
      color: 0xffffff,
      intensity: 0.1
    });

    spot.position.set(-50, 100, 100);
    spot.castShadow = true;
    spot.shadowDarkness = 0.2;

    scene.add(ambient, spot);
  }

  function createBar(total, z, colour) {

    for (var i = 0; i < total; i += 1) {

      var geometry = new THREE.BoxGeometry(2, 2, 2);
      geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 1, z));

      var material = new THREE.MeshPhongMaterial({
        color: colour
      });

      id = new THREE.Mesh(geometry, material);

      id.position.x = i * 5;
      id.name = "bar-" + i;
      id.castShadow = true;
      id.receiveShadow = true;

      scene.add(id);
      bar.push(id);

      selectedBar = bar[Math.floor(bar.length / 2)];
    }

    for (var i = 0; i < bar.length; i++) {

      var tween = new TweenMax.to(bar[i].scale, 1, {

        ease: Elastic.easeOut.config(1, 1),

        y: Math.random() * 30 /*i+1*/ ,
        delay: i * 0.25

      });
    }
  }

  function createFloor() {

    var geometry = new THREE.BoxGeometry(2000, 2000, 2000);
    var material = new THREE.MeshPhongMaterial({
      color: 0xcccccc,
      shininess: 20
    });
    material.side = THREE.BackSide;

    floor = new THREE.Mesh(geometry, material);

    floor.position.set(0, 1000, 0);
    floor.rotation.x = THREE.Math.degToRad(-90);

    floor.receiveShadow = true;

    scene.add(floor);
  }

  ///////////////////////
  // Render            //
  ///////////////////////

  function render() {

    tick++;

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
    render();

});