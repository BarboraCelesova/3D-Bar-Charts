$(function () {

///////////////////////
// Initial Variables //
///////////////////////

// Values
    var tick = 0;
    //var size = 0.25;
    var shiftInTime = 10;

    var red = 0xff0000;
    var blue = 0x1176c5;
    var pink = 0xFF1493;
    var green = 0x00ff00;
    var brown = 0xff8000;
    var black = 0x000000;

    var scene, camera, raycaster, mouse, renderer, controls;

// Arrays
    var bar = [];
    var dataset;
    var packetNum = {};
///////////////////////
// Initial Setup     //
///////////////////////

    init();
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener("contextmenu", function(e) { e.preventDefault(); });

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
        camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 10000);
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
        var projector = new THREE.Projector();

        camera.position.set(-1400, 500, 2500);
        camera.lookAt(new THREE.Vector3(-550, 1620, 660));


        //Axis helper
        /* var axisHelper = new THREE.AxisHelper(800);
         axisHelper.position.set(0,1,-900);
         scene.add(axisHelper);*/

        // Setup Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        //renderer.shadowMap.enabled = true;
        //renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild( renderer.domElement );

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.maxDistance = 3000;
        controls.minDistance = 100;
        controls.maxPolarAngle = (Math.PI / 2) - (Math.PI / 200);

        controls.update();


        // // resize scene based on browser window size
        // window.addEventListener('resize', function () {
        //     var WIDTH = window.innerWidth,
        //         HEIGHT = window.innerHeight;
        //     renderer.setSize(WIDTH, HEIGHT);
        //     camera.aspect = WIDTH / HEIGHT;
        //     camera.updateProjectionMatrix();
        // });


        renderer.render(scene, camera);


        $("#webGL-container").append(renderer.domElement);

        $.when($.ajax({
            url: 'dataset/bcsv.csv',
            dataType: 'text'
        }).done(parsingDataset)).then(init3DElements);
    }



    function onDocumentMouseDown( event ) {

        event.preventDefault();

        mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects(bar);

        if ( intersects.length > 0 ) {
            //console.log(intersects[ 0 ].object);
            if(event.which === 1){
                    intersects[0].object.material.color.setHex(Math.random() * 0xffffff);
            }
            else if (event.which === 3){
                // Get the modal
                var modal = document.getElementById('myModal');
                var content = document.getElementById("myModalBody");
                var text = 'Src IP addr, Dst IP add' + '<br/>';
                var timestamp = intersects[0].object['timestamp'];
                var protocol = intersects[0].object['protocol'];
                for(var i = 0; i < packetNum[timestamp][protocol]['count']; i++){
                    text = text + packetNum[timestamp][protocol]['srcIP'][i]
                        + '      ' + packetNum[timestamp][protocol]['dstIP'][i] + '<br/>';
                }
                content.innerHTML = text;

                // Get the <span> element that closes the modal
                var span = document.getElementsByClassName("close")[0];

                // When the user clicks on <span> (x), close the modal
                modal.style.display = "block";

                span.onclick = function() {
                    modal.style.display = "none";
                };
                // When the user clicks anywhere outside of the modal, close it
                window.onclick = function(event) {
                    if (event.target === modal) {
                        modal.style.display = "none";
                    }
                }
            }
        }
    }

    function init3DElements() {

        //console.log(dataset);

        var ref = parseInt(dataset[0].Timestamp);
        while (ref <= parseInt(dataset[dataset.length - 1].Timestamp)) {
            packetNum[ref] = {"ARP": {'count': 0, 'srcIP':[], 'dstIP':[]},
                "IP": {'count': 0, 'srcIP':[], 'dstIP':[]},
                "IPv6": {'count': 0, 'srcIP':[], 'dstIP':[]},
                "TCP": {'count': 0, 'srcIP':[], 'dstIP':[]},
                "UDP": {'count': 0, 'srcIP':[], 'dstIP':[]},
                "Others": {'count': 0, 'srcIP':[], 'dstIP':[]}};
            ref += shiftInTime; //shift in timestamps of charts
        }
        ref = parseInt(dataset[0].Timestamp);
        var idx;
        for (var i = 0; i < dataset.length; i++) {
            idx = Math.floor((parseInt(dataset[i].Timestamp) - ref) / shiftInTime) * shiftInTime + ref;
            switch (dataset[i].Prot) {
                case "arp":
                    packetNum[idx]['ARP']['count']++;
                    packetNum[idx]['ARP']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['ARP']['dstIP'].push(dataset[i]['DstIP']);
                    break;
                case "ip":
                    packetNum[idx]['IP']['count']++;
                    packetNum[idx]['IP']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['IP']['dstIP'].push(dataset[i]['DstIP']);
                    break;
                case "ipv6":
                    packetNum[idx]['IPv6']['count']++;
                    packetNum[idx]['IPv6']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['IPv6']['dstIP'].push(dataset[i]['DstIP']);
                    break;
                case "tcp":
                    packetNum[idx]['TCP']['count']++;
                    packetNum[idx]['TCP']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['TCP']['dstIP'].push(dataset[i]['DstIP']);
                    break;
                case "udp":
                    packetNum[idx]['UDP']['count']++;
                    packetNum[idx]['UDP']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['UDP']['dstIP'].push(dataset[i]['DstIP']);
                    break;
                default :
                    packetNum[idx]['Others']['count']++;
                    packetNum[idx]['Others']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['Others']['dstIP'].push(dataset[i]['DstIP']);
            }
        }
        console.log(packetNum);
        createFloor();
//creating bars
        i = 0;
        for (var timestamp in packetNum) {
            createBar(6, -400 + (-i * 5), timestamp);
            i++;
        }
        createLight();
        createDatGui();
    }

    function parsingDataset(data) {

        var lines = data.split("\n");
        var result = [];
        var headers = lines[0].split(",");
        for (var i = 1; i < lines.length; i++) {
            var obj = {};
            var currentLine = lines[i].split(",");
            for (var j = 0; j < headers.length; j++) {
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

        spot.position.set(-50, 5000, 1000);
        spot.castShadow = true;
        spot.shadowDarkness = 0.2;

        scene.add(ambient, spot);

    }

    function createBar(total, z, timestamp) {
        var i = 0;
        var colour;
        for (var protocol in packetNum[timestamp]) {
                var geometry = new THREE.BoxGeometry(2, packetNum[timestamp][protocol]['count'], 2);
                if (packetNum[timestamp][protocol]['count'] == 0 ) {
                    geometry = new THREE.BoxGeometry(2, 0.005, 2);
                }
                geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, z));

                switch (protocol) {
                    case "ARP":
                        colour = red;
                        break;
                    case "IP":
                        colour = pink;
                        break;
                    case "IPv6":
                        colour = blue;
                        break;
                    case "TCP":
                        colour = green;
                        break;
                    case "UDP":
                        colour = brown;
                        break;
                    default :
                        colour = black;
                }
                var material = new THREE.MeshPhongMaterial({
                    color: colour
                });

                id = new THREE.Mesh(geometry, material);

                id.position.x = i * 5;
                id.position.z = 1000;
                id['protocol'] = protocol;
                id['timestamp'] = timestamp;
                // id.name = "bar-" + i;
                // id.castShadow = true;
                // id.receiveShadow = true;

                scene.add(id);
                bar.push(id);

                selectedBar = bar[Math.floor(bar.length / 2)];

            i++;
            //animacia do vysky
            /*for (var i = 0; i < bar.length; i++) {

                var tween = new TweenMax.to(bar[i].scale, 1, {

                    ease: Elastic.easeOut.config(1, 1),

                    y: dataset[index].Vek,
                    delay: i * 0.25

                });
            }*/
        }
    }

    function createFloor() {

        var geometry = new THREE.BoxGeometry(6000, 6000, 2000);
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

    function createDatGui() {
        var arp = 0;
        var ip  = 1;
        var ipv6 = 2;
        var tcp = 3;
        var udp = 4;
        var others = 5;
        var gui = new dat.gui.GUI();
        var obj = {
            ARP: bar[arp].material.color.getHex(),
            IP: bar[ip].material.color.getHex(),
            IPv6: bar[ipv6].material.color.getHex(),
            TCP: bar[tcp].material.color.getHex(),
            UDP: bar[udp].material.color.getHex(),
            OTHERS: bar[others].material.color.getHex()
        };

        var colorFolder = gui.addFolder('Bars colors');
        var controllerARP = colorFolder.addColor(obj, 'ARP');
        controllerARP.onChange( function (colorValue) {
            for(var b = arp; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        })

        var controllerIP = colorFolder.addColor(obj, 'IP');
        controllerIP.onChange( function (colorValue) {
            for(var b = ip; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        })

        var controllerIPv6 = colorFolder.addColor(obj, 'IPv6');
        controllerIPv6.onChange( function (colorValue) {
            for(var b = ipv6; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        })

        var controllerTCP = colorFolder.addColor(obj, 'TCP');
        controllerTCP.onChange( function (colorValue) {
            for(var b = tcp; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        })

        var controllerUDP = colorFolder.addColor(obj, 'UDP');
        controllerUDP.onChange( function (colorValue) {
            for(var b = udp; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        })

        var controllerOTHERS = colorFolder.addColor(obj, 'OTHERS');
        controllerOTHERS.onChange( function (colorValue) {
            for(var b = others; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        })

    }
    
///////////////////////
// Render            //
///////////////////////

    function render() {

        tick++;

        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
    }

    render();

});