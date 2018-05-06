$(function () {

// Values
    THREE.SpriteAlignment = {};
    THREE.SpriteAlignment.topLeft = new THREE.Vector2( 1, -1 );
    THREE.SpriteAlignment.topCenter = new THREE.Vector2( 0, -1 );
    THREE.SpriteAlignment.topRight = new THREE.Vector2( -1, -1 );
    THREE.SpriteAlignment.centerLeft = new THREE.Vector2( 1, 0 );
    THREE.SpriteAlignment.center = new THREE.Vector2( 0, 0 );
    THREE.SpriteAlignment.centerRight = new THREE.Vector2( -1, 0 );
    THREE.SpriteAlignment.bottomLeft = new THREE.Vector2( 1, 1 );
    THREE.SpriteAlignment.bottomCenter = new THREE.Vector2( 0, 1 );
    THREE.SpriteAlignment.bottomRight = new THREE.Vector2( -1, 1 );

    var tick = 0;
    var shiftInTime = 10;

    var red = 0xff0000;
    var blue = 0x1176c5;
    var pink = 0xFF1493;
    var green = 0x00ff00;
    var brown = 0xff8000;
    var black = 0x000001;

    var scene, camera, raycaster, mouse, renderer, controls;
    var modal, header, content, span, table;

// Arrays
    var bar = [];
    var lines = [];
    var dataset;
    var packetNum = {};
    var gui;

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

        camera.position.set(-4000, 2000, 5000);

        //camera.lookAt(new THREE.Vector3(10000, 2500, 860));

        // Setup Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild( renderer.domElement );

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.maxDistance = 5000;
        controls.minDistance = 100;
        controls.maxPolarAngle = (Math.PI / 2) - (Math.PI / 300);
        controls.panningMode = 1;

        controls.update();

        // Get the modal
        modal = document.getElementById('myModal');
        header = document.getElementById('myModalHeader');
        content = document.getElementById("myModalBody");
        table = document.getElementById("myTable");

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
        }).done(parsingDataset)).then(createDatGui);
    }


    function onDocumentMouseDown( event ) {

        mouse.x = ( event.clientX / renderer.domElement.width ) * 2 - 1;
        mouse.y = - ( event.clientY / renderer.domElement.height ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects(bar);

        if ( intersects.length > 0 ) {
            // After left-click on bar
            if(event.which === 1){
                //changing colour after click
                intersects[0].object.material.color.setHex(intersects[0].object.material.color.getHex() * 0xffffff);
                if (intersects[0].object['spritey'].visible){
                    scene.remove(intersects[0].object['spritey']);
                    intersects[0].object['spritey'].visible = false;
                    scene.remove(lines.find(function (value) {
                        return value.name === intersects[0].object.name;
                    }));
                    removeByAttr(lines, 'name', intersects[0].object.name);
                }
                else {
                    scene.add(intersects[0].object['spritey']);
                    intersects[0].object['spritey'].visible = true;

                    var material = new THREE.LineBasicMaterial({
                        color: getRandomColor()
                    });

                    var geometry = new THREE.Geometry();
                    geometry.vertices.push(
                        new THREE.Vector3( -10, 0, 0 ),
                        new THREE.Vector3( 0, 0, 0 ),
                        new THREE.Vector3( 5 * Object.keys(packetNum).length, 0, 0 )
                    );

                    var line = new THREE.Line( geometry, material );
                    line.position.z = 2005 - (5 * Object.keys(packetNum).length);
                    line.position.y = intersects[0].object['height'];
                    line.rotation.y = THREE.Math.degToRad(-90);
                    line.name = intersects[0].object.name;
                    scene.add( line );
                    lines.push(line);

                }
            }
            //Right click - modal window with srcIP, dstIP, state and attack + filtering
            else if (event.which === 3){
                var timestamp = intersects[0].object['timestamp'];
                var protocol = intersects[0].object['protocol'];

                header.innerHTML = ' <h2> Details - ' + packetNum[timestamp][protocol]['count'] + ' packets &emsp; &emsp; &emsp;Time: ' + toTime(timestamp) + '</h2>';
                var text ='<tr class="header"><th>Src IP add</th><th>Dst IP add</th><th>State</th><th>Attack</th></tr>';

                for(var i = 0; i < packetNum[timestamp][protocol]['count']; i++){
                        text = text + '<tr><td>' + packetNum[timestamp][protocol]['srcIP'][i] + '</td><td>'
                            + packetNum[timestamp][protocol]['dstIP'][i] + '</td><td>'
                            + packetNum[timestamp][protocol]['state'][i] + '</td><td>'
                            + packetNum[timestamp][protocol]['attackLabel'][i] + '</td></tr>';
                    }
                table.innerHTML = text;

                // When the user clicks on <span> (x), close the modal
                modal.style.display = "block";
            }
        }
    }

    function init3DElements() {

        //console.log(dataset);

        var ref = parseInt(dataset[0].Timestamp);
        while (ref <= parseInt(dataset[dataset.length - 1].Timestamp)) {
            packetNum[ref] = {"ARP": {'count': 0, 'srcIP':[], 'dstIP':[], 'state':[], 'attackLabel':[]},
                "IP": {'count': 0, 'srcIP':[], 'dstIP':[], 'state':[], 'attackLabel':[]},
                "IPv6": {'count': 0, 'srcIP':[], 'dstIP':[], 'state':[], 'attackLabel':[]},
                "TCP": {'count': 0, 'srcIP':[], 'dstIP':[], 'state':[], 'attackLabel':[]},
                "UDP": {'count': 0, 'srcIP':[], 'dstIP':[], 'state':[], 'attackLabel':[]},
                "Others": {'count': 0, 'srcIP':[], 'dstIP':[], 'state':[], 'attackLabel':[]}};
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
                    packetNum[idx]['ARP']['state'].push(dataset[i]['State']);
                    packetNum[idx]['ARP']['attackLabel'].push(dataset[i]['AttackLabel']);
                    break;
                case "ip":
                    packetNum[idx]['IP']['count']++;
                    packetNum[idx]['IP']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['IP']['dstIP'].push(dataset[i]['DstIP']);
                    packetNum[idx]['IP']['state'].push(dataset[i]['State']);
                    packetNum[idx]['IP']['attackLabel'].push(dataset[i]['AttackLabel']);
                    break;
                case "ipv6":
                    packetNum[idx]['IPv6']['count']++;
                    packetNum[idx]['IPv6']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['IPv6']['dstIP'].push(dataset[i]['DstIP']);
                    packetNum[idx]['IPv6']['state'].push(dataset[i]['State']);
                    packetNum[idx]['IPv6']['attackLabel'].push(dataset[i]['AttackLabel']);
                    break;
                case "tcp":
                    packetNum[idx]['TCP']['count']++;
                    packetNum[idx]['TCP']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['TCP']['dstIP'].push(dataset[i]['DstIP']);
                    packetNum[idx]['TCP']['state'].push(dataset[i]['State']);
                    packetNum[idx]['TCP']['attackLabel'].push(dataset[i]['AttackLabel']);
                    break;
                case "udp":
                    packetNum[idx]['UDP']['count']++;
                    packetNum[idx]['UDP']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['UDP']['dstIP'].push(dataset[i]['DstIP']);
                    packetNum[idx]['UDP']['state'].push(dataset[i]['State']);
                    packetNum[idx]['UDP']['attackLabel'].push(dataset[i]['AttackLabel']);
                    break;
                default :
                    packetNum[idx]['Others']['count']++;
                    packetNum[idx]['Others']['srcIP'].push(dataset[i]['SrcIP']);
                    packetNum[idx]['Others']['dstIP'].push(dataset[i]['DstIP']);
                    packetNum[idx]['Others']['state'].push(dataset[i]['State']);
                    packetNum[idx]['Others']['attackLabel'].push(dataset[i]['AttackLabel']);
            }
        }
        //console.log(packetNum);
        createFloor();

        //creating bars
        i = 0;
        for (var timestamp in packetNum) {
            createBar(6, 1000 + (-i * 5), timestamp);
            i++;
        }

        //timestamp axis
        var help = 2000;

        var pom = 0;
        for (var timestamp in packetNum) {

            if (pom % 20 == 0)
            {
                var spriteyAxis = makeTextSpriteAxis(toTime(timestamp));
                spriteyAxis.position.set(-60, 0, help);
                scene.add(spriteyAxis);
                help = help - 100;
            }
            pom++;
        }
        createLight();
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
        dataset = result;

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

                var spritey = makeTextSpriteLabel(" " + protocol + " - " + packetNum[timestamp][protocol]['count'] + " ");
                spritey.position.set(0, (packetNum[timestamp][protocol]['count'] / 2) - 10, z + 1030);
                spritey.visible = false;

                var id = new THREE.Mesh(geometry, material);

                id.position.x = i * 5;
                id.position.z = 1000;
                id['protocol'] = protocol;
                id['timestamp'] = timestamp;
                id['spritey'] = spritey;
                id['height'] = packetNum[timestamp][protocol]['count'] / 2;
                id.name = timestamp + "-" + i;

                scene.add(id);
                bar.push(id);

            i++;
        }
    }

    function createFloor() {

        var geometry = new THREE.BoxGeometry(6000, 8000, 2000);
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

        gui = new dat.gui.GUI();

        var obj;

        if(bar.length === 0){
            obj = {
                ARP: red,
                IP: pink,
                IPv6: blue,
                TCP: green,
                UDP: brown,
                OTHERS: black
            };
        }
        else{
            obj = {
                ARP: bar[arp].material.color.getHex(),
                IP: bar[ip].material.color.getHex(),
                IPv6: bar[ipv6].material.color.getHex(),
                TCP: bar[tcp].material.color.getHex(),
                UDP: bar[udp].material.color.getHex(),
                OTHERS: bar[others].material.color.getHex()
            };
        }

        var funkcia = {
            MathFunction: 'Less',
            Number : 50,
            Reset : function() { resetBars() },
            Time : shiftInTime
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
        var controllerCount = filterFolder.add(funkcia, "Number", 0, 800);
        controllerCount.name("Number [packets] ");

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

        var scaleFolder = gui.addFolder('Time scale');
        scaleFolder.open();
        var controllerScale = scaleFolder.add(funkcia, "Time");
        controllerScale.name("Time [s] (min 5)");
        controllerScale.onChange(function () {
            shiftInTime = funkcia.Time;
            packetNum = {};
            bar = [];
            scene = new THREE.Scene();
            init3DElements();
            resetBars();

        });

        gui.add(funkcia, 'Reset').name("Reset bars");

        function resetBars (){

            var count = lines.length;
            for (var i = 0; i < count; i++){
                scene.remove(lines.find(function (value) {
                    return value.name === lines[0].name;
                }));
                removeByAttr(lines, 'name', lines[0].name);
            }

            for (var b = 0; b < bar.length; b++) {
                bar[b].material.opacity = 1;
                bar[b]['spritey'].visible = false;
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
            colorFolder.remove(controllerARP);
            colorFolder.remove(controllerIP);
            colorFolder.remove(controllerIPv6);
            colorFolder.remove(controllerTCP);
            colorFolder.remove(controllerUDP);
            colorFolder.remove(controllerOTHERS);
            obj = {
                ARP: bar[arp].material.color.getHex(),
                IP: bar[ip].material.color.getHex(),
                IPv6: bar[ipv6].material.color.getHex(),
                TCP: bar[tcp].material.color.getHex(),
                UDP: bar[udp].material.color.getHex(),
                OTHERS: bar[others].material.color.getHex()
            };
            controllerARP = colorFolder.addColor(obj, 'ARP');
            controllerARP.onChange( function (colorValue) {
                for(var b = arp; b < bar.length; b+=6){
                    bar[b].material.color = new THREE.Color(colorValue);
                }
            });

            controllerIP = colorFolder.addColor(obj, 'IP');
            controllerIP.onChange( function (colorValue) {
                for(var b = ip; b < bar.length; b+=6){
                    bar[b].material.color = new THREE.Color(colorValue);
                }
            });

            controllerIPv6 = colorFolder.addColor(obj, 'IPv6');
            controllerIPv6.onChange( function (colorValue) {
                for(var b = ipv6; b < bar.length; b+=6){
                    bar[b].material.color = new THREE.Color(colorValue);
                }
            });

            controllerTCP = colorFolder.addColor(obj, 'TCP');
            controllerTCP.onChange( function (colorValue) {
                for(var b = tcp; b < bar.length; b+=6){
                    bar[b].material.color = new THREE.Color(colorValue);
                }
            });

            controllerUDP = colorFolder.addColor(obj, 'UDP');
            controllerUDP.onChange( function (colorValue) {
                for(var b = udp; b < bar.length; b+=6){
                    bar[b].material.color = new THREE.Color(colorValue);
                }
            });

            controllerOTHERS = colorFolder.addColor(obj, 'OTHERS');
            controllerOTHERS.onChange( function (colorValue) {
                for(var b = others; b < bar.length; b+=6){
                    bar[b].material.color = new THREE.Color(colorValue);
                }
            });
        }
        init3DElements();
    }

    function makeTextSpriteLabel( message, parameters ) {
        if ( parameters === undefined ) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 25;

        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 2;

        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

        var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
            parameters["backgroundColor"] : { r:207, g:253, b:82, a:1.0 };

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = "Bold " + fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = context.measureText( message );
        var textWidth = metrics.width;

        // background color
        context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
            + backgroundColor.b + "," + backgroundColor.a + ")";
        // border color
        context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
            + borderColor.b + "," + borderColor.a + ")";

        context.lineWidth = borderThickness;
        roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
        // 1.4 is extra height factor for text below baseline: g,j,p,q.

        // text color
        context.fillStyle = "rgba(0, 0, 0, 1.0)";

        context.fillText( message, borderThickness, fontsize + borderThickness);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial(
            { map: texture, useScreenCoordinates: false } );
        var sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(100, 100, 1);
        return sprite;
    }

    function makeTextSpriteAxis(message, opts) {
        var parameters = opts || {};
        var fontface = parameters.fontface || 'Helvetica';
        var fontsize = parameters.fontsize || 50;
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        context.font = fontsize + "px " + fontface;

        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;

        // text color
        context.fillStyle = 'rgba(0, 0, 0, 1.0)';
        context.fillText(message, 0, fontsize);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            useScreenCoordinates: false
        });
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(100, 50, 1.0);
        return sprite;
    }

    function toTime(time){
        var date = new Date(time*1000);
        // Hours part from the timestamp
        var hours = date.getHours();
        // Minutes part from the timestamp
        var minutes = "0" + date.getMinutes();
        // Seconds part from the timestamp
        var seconds = "0" + date.getSeconds();

        // Will display time in 10:30:23 format
        var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
        return (formattedTime);
    }

    var removeByAttr = function(arr, attr, value){
        var i = arr.length;
        while(i--){
            if( arr[i]
                && arr[i].hasOwnProperty(attr)
                && (arguments.length > 2 && arr[i][attr] === value ) ){

                arr.splice(i,1);

            }
        }
        return arr;
    };

    // function for drawing rounded rectangles
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x+r, y);
        ctx.lineTo(x+w-r, y);
        ctx.quadraticCurveTo(x+w, y, x+w, y+r);
        ctx.lineTo(x+w, y+h-r);
        ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        ctx.lineTo(x+r, y+h);
        ctx.quadraticCurveTo(x, y+h, x, y+h-r);
        ctx.lineTo(x, y+r);
        ctx.quadraticCurveTo(x, y, x+r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    function getRandomColor() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.round(Math.random() * 15)];
        }
        return color;
    }

    function render() {

        tick++;

        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
    }

    render();

});