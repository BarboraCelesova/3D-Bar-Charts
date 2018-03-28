$(function() {

///////////////////////
// Initial Variables //
///////////////////////

// Values
var tick = 0;
var size = 0.25;
var shiftInTime = 40;

var red = 0xff0000;
var blue = 0x1176c5;
var white = 0xf9f9f9;
var green  = 0x00ff00;
var brown = 0xff8000;
var black = 0x000000;

// Arrays
var bar = [];
var dataset;
var packetNum = {};
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
camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10000);

camera.position.set(-800, 300, 1300);
camera.lookAt(new THREE.Vector3(-150, 320, 560));

// Setup Renderer
  renderer = new THREE.WebGLRenderer({
  antialias: true
});

// renderer.shadowMap.enabled = true;
//renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

$("#webGL-container").append(renderer.domElement);

  $.when($.ajax({
      url: 'dataset/bcsv.csv',
      dataType: 'text'
  }).done(parsingDataset)).then(init3DElements);
}

function init3DElements() {

  //console.log(dataset);

  var ref = parseInt(dataset[0].Timestamp);
  while(ref <= parseInt(dataset[dataset.length - 1].Timestamp)){
      packetNum[ref] = {"ARP": 0, "IP": 0, "IPv6": 0, "TCP": 0, "UDP": 0, "Others": 0};
      ref += shiftInTime; //shift in timestamps of charts
  }
  ref = parseInt(dataset[0].Timestamp);
  var idx;
  for(var i = 0; i < dataset.length; i++){
      idx = Math.floor((parseInt(dataset[i].Timestamp) - ref) / shiftInTime) * shiftInTime + ref; //pri 9008 to ide a pri 9009 to zblbne...
      switch(dataset[i].Prot){
          case "arp": packetNum[idx].ARP++; break;
          case "ip": packetNum[idx].IP++; break;
          case "ipv6": packetNum[idx].IPv6++; break;
          case "tcp": packetNum[idx].TCP++; break;
          case "udp": packetNum[idx].UDP++; break;
          default : packetNum[idx].Others++;
      }
  }
  console.log(packetNum);
createFloor();
//creating bars
  i = 0;
  for (var timestamp in packetNum) {
      createBar(6, -400+(-i*5), timestamp);
      i++;
  }
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
    dataset = result; //JavaScript object

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

spot.position.set(-50, 1000, 1000);
spot.castShadow = true;
spot.shadowDarkness = 0.2;

scene.add(ambient, spot);
}

function createBar(total, z, timestamp) {
var i = 0;
var colour;
for (var protocol in packetNum[timestamp]) {

    var geometry = new THREE.BoxGeometry(2, packetNum[timestamp][protocol], 2);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 1, z));

    switch(protocol){
        case "ARP": colour = red; break;
        case "IP": colour = white; break;
        case "IPv6": colour = blue; break;
        case "TCP": colour = green; break;
        case "UDP": colour = brown; break;
        default : colour = black;
    }
    var material = new THREE.MeshPhongMaterial({
        color: colour
    });

    id = new THREE.Mesh(geometry, material);

    id.position.x = i * 5;
    id.position.z = 1000;
    id.name = "bar-" + i;
    id.castShadow = true;
    id.receiveShadow = true;

    scene.add(id);
    bar.push(id);

    selectedBar = bar[Math.floor(bar.length / 2)];
    i++;
}

//animacia do vysky
/*for (var i = 0; i < bar.length; i++) {

    var tween = new TweenMax.to(bar[i].scale, 1, {

        ease: Elastic.easeOut.config(1, 1),

        y: dataset[index].Vek,
        delay: i * 0.25

    });
}*/
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