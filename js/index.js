$(function () {

// Values
    var tick = 0;
    var shiftInTime = 10;

    var red = 0xff0000;
    var blue = 0x1176c5;
    var pink = 0xFF1493;
    var green = 0x00ff00;
    var brown = 0xff8000;
    var black = 0x000000;

    var scene, camera, raycaster, mouse, renderer, controls;
    var modal, header, content, span;

// Arrays
    var bar = [];
    var dataset;
    var packetNum = {};
    // var opts = {
    //      height: 2000,
    //      width: 2000,
    //      linesHeight: 10,
    //      linesWidth: 20,
    //      color: 0xcccccc
    //     };

    init();
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener("contextmenu", function(e) { e.preventDefault(); });

    function init() {
        initListeners();
        init3DScene();
        //createAGrid(opts);
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

        camera.position.set(-1400, 500, 2500);
        camera.lookAt(new THREE.Vector3(-550, 1620, 660));

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

        // Get the modal
        modal = document.getElementById('myModal');
        header = document.getElementById('myModalHeader');
        content = document.getElementById("myModalBody");

        // Get the <span> element that closes the modal
        span = document.getElementsByClassName("close")[0];
        span.onclick = function() {
            modal.style.display = "none";
        };

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };

        renderer.render(scene, camera);

        $("#webGL-container").append(renderer.domElement);

        $.when($.ajax({
            url: 'dataset/bcsv.csv',
            dataType: 'text'
        }).done(parsingDataset)).then(init3DElements);
    }


    function onDocumentMouseDown( event ) {

        //event.preventDefault();

        mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects(bar);

        if ( intersects.length > 0 ) {

            if(event.which === 1){
                    intersects[0].object.material.color.setHex(intersects[0].object.material.color.getHex() * 0xffffff);
            }
            else if (event.which === 3){
                var timestamp = intersects[0].object['timestamp'];
                var protocol = intersects[0].object['protocol'];

                header.innerHTML = ' <h2> Details - ' + packetNum[timestamp][protocol]['count'] + ' packets </h2>';

                var text = '<h3>Src IP addr  <span class="tab9"> Dst IP add </h3> </span> <br/>';
                for(var i = 0; i < packetNum[timestamp][protocol]['count']; i++){
                    text = text + packetNum[timestamp][protocol]['srcIP'][i]
                        + ' <span class="tab9">' + packetNum[timestamp][protocol]['dstIP'][i] + '</span> <br/>';
                }
                content.innerHTML = text;

                // When the user clicks on <span> (x), close the modal
                modal.style.display = "block";
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

    function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

    }

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
                if (packetNum[timestamp][protocol]['count'] == 0) {
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
                    color: colour,
                    transparent : true,
                    opacity : 1
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

        var funkcia = {
            MathFunction: 'Less',
            Number : 50,
            Reset : function() { resetBars() }
        };

        var colorFolder = gui.addFolder('Bars colors');
        colorFolder.open();

        var controllerARP = colorFolder.addColor(obj, 'ARP');
        controllerARP.onChange( function (colorValue) {
            for(var b = arp; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        });

        var controllerIP = colorFolder.addColor(obj, 'IP');
        controllerIP.onChange( function (colorValue) {
            for(var b = ip; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        });

        var controllerIPv6 = colorFolder.addColor(obj, 'IPv6');
        controllerIPv6.onChange( function (colorValue) {
            for(var b = ipv6; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        });

        var controllerTCP = colorFolder.addColor(obj, 'TCP');
        controllerTCP.onChange( function (colorValue) {
            for(var b = tcp; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        });

        var controllerUDP = colorFolder.addColor(obj, 'UDP');
        controllerUDP.onChange( function (colorValue) {
            for(var b = udp; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        });

        var controllerOTHERS = colorFolder.addColor(obj, 'OTHERS');
        controllerOTHERS.onChange( function (colorValue) {
            for(var b = others; b < bar.length; b+=6){
                bar[b].material.color = new THREE.Color(colorValue);
            }
        });


        var filterFolder = gui.addFolder('Filter');
        filterFolder.open();

        filterFolder.add(funkcia, "MathFunction", ['Less', 'Greater', 'Equal']);
        var controllerCount = filterFolder.add(funkcia, "Number", 0, 500);

        controllerCount.onChange(function () {
            for (var b = 0; b < bar.length; b++) {
                bar[b].material.opacity = 1;
            }
                switch (funkcia.MathFunction){
                    case "Greater":
                        for (var b = 0; b < bar.length; b++) {
                            if (packetNum[bar[b]['timestamp']][bar[b]['protocol']]['count'] < funkcia.Number){
                                bar[b].material.opacity = 0.3;
                            }
                        }
                        break;
                    case "Less":
                        for (var b = 0; b < bar.length; b++) {
                            if (packetNum[bar[b]['timestamp']][bar[b]['protocol']]['count'] > funkcia.Number){
                                bar[b].material.opacity = 0.3;
                            }
                        }
                        break;
                    case "Equal":
                        for (var b = 0; b < bar.length; b++) {
                            if (packetNum[bar[b]['timestamp']][bar[b]['protocol']]['count'] != funkcia.Number){
                                bar[b].material.opacity = 0.3;
                            }
                        }
                        break;
                }
        });
        gui.add(funkcia, 'Reset').name("Reset bars");

        function resetBars (){
            for (var b = 0; b < bar.length; b++) {
                bar[b].material.opacity = 1;
                switch (bar[b]['protocol']) {
                    case "ARP":
                        bar[b].material.color = new THREE.Color(red);
                        break;
                    case "IP":
                        bar[b].material.color = new THREE.Color(pink);
                        break;
                    case "IPv6":
                        bar[b].material.color = new THREE.Color(blue);
                        break;
                    case "TCP":
                        bar[b].material.color = new THREE.Color(green);
                        break;
                    case "UDP":
                        bar[b].material.color = new THREE.Color(brown);
                        break;
                    default :
                        bar[b].material.color = new THREE.Color(black);
                }
            }
        }

    }

    function createAGrid(opts) {
        var config = opts || {
            height: 6000,
            width: 6000,
            linesHeight: 100,
            linesWidth: 100,
            color: 0xDD006C
        };

        var material = new THREE.LineBasicMaterial({
            color: config.color,
            opacity: 0.2
        });

        var gridObject = new THREE.Object3D(),
            gridGeo = new THREE.Geometry(),
            stepw = 2 * config.width / config.linesWidth,
            steph = 2 * config.height / config.linesHeight;

        //width
        for (var i = -config.width; i <= config.width; i += stepw) {
            gridGeo.vertices.push(new THREE.Vector3(-config.height, i, 0));
            gridGeo.vertices.push(new THREE.Vector3(config.height, i, 0));

        }
        //height
        for (var i = -config.height; i <= config.height; i += steph) {
            gridGeo.vertices.push(new THREE.Vector3(i, -config.width, 0));
            gridGeo.vertices.push(new THREE.Vector3(i, config.width, 0));
        }

        var line = new THREE.Line(gridGeo, material, THREE.LinePieces);
        gridObject.add(line);

        return gridObject;
    }
    
    function render() {

        tick++;

        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
    }

    render();

});