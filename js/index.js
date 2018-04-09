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
        camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 10000);

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

    function init3DElements() {


        //console.log(dataset);

        var ref = parseInt(dataset[0].Timestamp);
        while (ref <= parseInt(dataset[dataset.length - 1].Timestamp)) {
            packetNum[ref] = {"ARP": 0, "IP": 0, "IPv6": 0, "TCP": 0, "UDP": 0, "Others": 0};
            ref += shiftInTime; //shift in timestamps of charts
        }
        ref = parseInt(dataset[0].Timestamp);
        var idx;
        for (var i = 0; i < dataset.length; i++) {
            idx = Math.floor((parseInt(dataset[i].Timestamp) - ref) / shiftInTime) * shiftInTime + ref;
            switch (dataset[i].Prot) {
                case "arp":
                    packetNum[idx].ARP++;
                    break;
                case "ip":
                    packetNum[idx].IP++;
                    break;
                case "ipv6":
                    packetNum[idx].IPv6++;
                    break;
                case "tcp":
                    packetNum[idx].TCP++;
                    break;
                case "udp":
                    packetNum[idx].UDP++;
                    break;
                default :
                    packetNum[idx].Others++;
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
                var geometry = new THREE.BoxGeometry(2, packetNum[timestamp][protocol], 2);
                if (packetNum[timestamp][protocol] == 0 ) {
                    var geometry = new THREE.BoxGeometry(2, 0.005, 2);
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