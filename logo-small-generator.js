let svgUrl = "./assets/logo-small-polygons-02.svg";

d3.xml(svgUrl)
    .mimeType("image/svg+xml")
    .get(function(error, xml) {
        if (error) throw error;
        document.getElementById('logo-box')
            .appendChild(xml.documentElement);

        // d3.select('#logo-box').append('h2')
        //     .attr('class', 'text-center')
        //     .style('opacity', 0)
        //     .style('letter-spacing', '-0.5px')
        //     .html('Letteratura e visualizzazione')

        // let subtitle = document.createElement('div');
        // subtitle.innerHTML = 'cdsvr';
        // document.getElementById('logo-box').appendChild( subtitle );

        let calogo = d3.select("#calogo");

        let width = calogo.attr("viewBox")
            .split(' ')[2],
            height = calogo.attr("viewBox")
            .split(' ')[3],
            rootNode,
            nodes = [],
            node = calogo.selectAll(".node"),
            scaleFactor = 1,
            lettersPolygons = [],
            fibonacci = [1, 2, 3, 3, 5, 8, 13, 21, 34, 55],
            margin = {};

        let config = [{
            collisionMargin: .25,
            amountNodes: 700,
            radiusRootNode: 6,
            rootPosition: [201.0764923095703 + 3 + 0.002, 88.30018615722656 + 3 - 0.002],
            margin: {
                top: 0,
                bottom: scaleFactor * height,
                left: 0,
                right: scaleFactor * width
            }
    }]

        let configuration = config[0];

        // A class for converting the poligons into an object suitable for the library svg-points.js
        class polygonModel {
            constructor(type, attr, element) {
                this['type'] = type;
                this[attr] = d3.select(element)
                    .attr(attr);
            }
        }

        // Convert all polygons in array of coordinates, thanks to svg-points.js
        calogo.selectAll('polygon')
            .each(function() {
                let thisPolygon = new polygonModel('polygon', 'points', this);
                let thisPolygonPointsObjects = SVGPoints.toPoints(thisPolygon);
                let thisPolygonPointsArray = [];
                thisPolygonPointsObjects.forEach(function(d) {
                    thisPolygonPointsArray.push([d.x, d.y]);
                });
                lettersPolygons.push(thisPolygonPointsArray);
            });

        console.log(lettersPolygons)

        // This function checks whether the circle is or not whitin any of the letters polygon
        function checkIfInside(coordinates) {
            let flag = 0;
            lettersPolygons.forEach(function(d) {
                if (d3.polygonContains(d, coordinates)) {
                    flag++;
                }
            })
            // if the flag is grater than one, the point is inside a letter eye
            if (flag == 1) {
                return true;
            } else {
                return false;
            }
        }

        // A function for randomly adding circles to the nodes array
        function addNodes(n, rootN) {
            for (let i = 0; i < n; i++) {

                let myX = d3.randomUniform(configuration.margin.left, configuration.margin.right)();
                let myY = d3.randomUniform(configuration.margin.top, configuration.margin.bottom)();
                let myRadius = Math.round(fibonacci[Math.round(d3.randomUniform(1, 5)())]) / 2;

                nodes.push({ 'id': i, 'r': myRadius, 'x': myX, 'y': myY });
            }
            if (rootN == true) {
                if (configuration.radiusRootNode && !rootNode) {
                    rootNode = nodes[0];
                    rootNode.r = 8/2.8;
                }
            }

        }

        let collideForce = d3.forceCollide(function(d) { return d.r + configuration.collisionMargin });

        function ticked() {
            node.attr("cx", function(d) { return d.x = Math.max(d.r, Math.min(width - d.r, d.x)); })
                .attr("cy", function(d) { return d.y = Math.max(d.r, Math.min(height - d.r, d.y)); })
                .classed('is-inside', function(d) { return checkIfInside([d.x, d.y]) })
        }

        //Declare simulation
        let simulation = d3.forceSimulation(nodes)
            .force("x", null)
            .force("y", null)
            .force("charge", null)
            .force("collide", collideForce)
            .alpha(1)
            .alphaMin(.7)
            .alphaDecay(0.01)
            .on("tick", ticked);

        // Update function
        function update() {
            let beginTime = d3.now();

            // if(window.width > 767) { collisionMargin = .5 }

            function drawGraph() {
                // Apply the general update pattern to the nodes.
                node = node.data(nodes, function(d) { return d.id; });

                node.exit()
                    .remove();

                node = node.enter()
                    .append("circle")
                    .classed('node', true)

                    .classed('is-inside', function(d) { return checkIfInside([d.x, d.y]) })
                    .classed('root-node', function(d) { if (d.id == 0) { return true } else { return false } })
                    .attr('cx', function(d) { return d.x; })
                    .attr('cy', function(d) { return d.y; })
                    .attr('r', function(d) { return d.r; })
                    .merge(node)

            }

            drawGraph();

            // Update and restart the simulation.
            simulation.nodes(nodes)
                .alpha(1)
                .restart();
        }

        // Anticolllision on mouse move
        calogo.on("mousemove", function() {
            let p1 = d3.mouse(this);
            if (rootNode) {
                rootNode.fx = p1[0];
                rootNode.fy = p1[1];
                simulation
                    .alpha(1)
                    .restart(); //reheat the simulation
            }
        });

        calogo.on("mouseleave", function() {
            d3.select('.root-node')
                .transition()
                .duration(000)
                // .ease(d3.easePolyInOut)
                // .attr('cx', 615)
                // .attr('cy', 250)
                .on("end", function() {
                    rootNode.fx = configuration.rootPosition[0];
                    rootNode.fy = configuration.rootPosition[1];
                });
        });

        let instr = `press r for generating new nodes.
            press f for restarting the simulation without any changes.
            press p for stopping the force simulation.
            press g for setting a grey background.
            press w for setting a white background.
            press a for removing all the nodes not part of the lettering and for saving the positions of the visibile ones.
            press d for downloading the JSOn corresponding to the nodes array.`

        console.log(instr)

        d3.select('body')
            .on('keypress', function() {
                if (d3.event.key == 'd') {
                    var file = new File([JSON.stringify(nodes, null, 2)], "nodes.json", { type: "application/json;charset=utf-8" });
                    saveAs(file);
                } else if (d3.event.key == 'r') {
                    nodes.forEach(function(d) {
                        d.x = d3.randomUniform(configuration.margin.left, configuration.margin.right)();
                        d.y = d3.randomUniform(configuration.margin.top, configuration.margin.bottom)();
                        simulation.alpha(1)
                            .restart();
                    })
                } else if (d3.event.key == 'f') {
                    simulation.alpha(1)
                        .restart();
                } else if (d3.event.key == 'g') {
                    d3.select('body')
                        .style('background', 'grey');
                } else if (d3.event.key == 'w') {
                    d3.select('body')
                        .style('background', 'white');
                } else if (d3.event.key == 'p') {
                    simulation.stop();
                } else if (d3.event.key == 'a') {
                    let insideNodes = [];
                    for (let i = nodes.length - 1; i >= 0; i--) {
                        let n = nodes[i];
                        // console.log(n.id, n.x, n.y);
                        // console.log(checkIfInside([n.x, n.y]))
                        if (checkIfInside([n.x, n.y])) {
                            insideNodes.push(n);
                        }
                    }
                    console.log(nodes.length, insideNodes.length);
                    nodes = insideNodes;

                    console.log()

                    simulation
                        .nodes(nodes)
                        .force("x", d3.forceX(function(d) { return d.x }))
                        .force("y", d3.forceY(function(d) { return d.y }))
                        .force("charge", null)
                        .force("collide", collideForce)
                        // .force("collide", null)
                        .alpha(1);
                    // .restart();

                    update();
                }
            })

        addNodes(configuration.amountNodes, true);
        update();
        // })

    }); // end of everything