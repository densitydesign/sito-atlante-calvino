let svgUrl = "./assets/interactive-logo-crimson-ver001-01.svg";

d3.xml(svgUrl).mimeType("image/svg+xml").get(function(error, xml) {
    if (error) throw error;
    document.getElementById('logo-box').appendChild(xml.documentElement);

    d3.select('#logo-box').append('h2')
        .attr('class', 'text-center')
        .style('opacity', 0)
        .style('letter-spacing', '-0.5px')
        .html('Letteratura e visualizzazione')

    // let subtitle = document.createElement('div');
    // subtitle.innerHTML = 'cdsvr';
    // document.getElementById('logo-box').appendChild( subtitle );


    let calogo = d3.select("#calogo");

    let width = calogo.attr("viewBox").split(' ')[2],
        height = calogo.attr("viewBox").split(' ')[3],
        rootNode,
        nodes = [],
        node = calogo.selectAll(".node"),
        scaleFactor = 1,
        lettersPolygons = [],
        fibonacci = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
        margin = {};

    let config = [{
        // nodeRadius: 3.5,
        collisionMargin: 1,
        amountNodes: 3600,
        radiusRootNode: 18,
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
            this[attr] = d3.select(element).attr(attr);
        }
    }

    // Convert all polygons in array of coordinates, thanks to svg-points.js
    calogo.selectAll('polygon').each(function() {
        let thisPolygon = new polygonModel('polygon', 'points', this);
        let thisPolygonPointsObjects = SVGPoints.toPoints(thisPolygon);
        let thisPolygonPointsArray = [];
        thisPolygonPointsObjects.forEach(function(d) {
            thisPolygonPointsArray.push([d.x, d.y]);
        });
        lettersPolygons.push(thisPolygonPointsArray);
    });

    // This function checks whether the circle is or not whitin any of the letters polygon
    function checkIfInside(coordinates) {
        let flag = 0;
        lettersPolygons.forEach(function(d) {
            if (d3.polygonContains(d, coordinates)) {
                flag++;
            }
        })
        if (flag == 1) {
            return true;
        } else {
            return false;
        }
    }

    // A function for randomly adding circles to the nodes array
    function addNodes(n) {
        for (let i = 0; i < n; i++) {
            let myX = d3.randomUniform(configuration.margin.left, configuration.margin.right)();
            let myY = d3.randomUniform(configuration.margin.top, configuration.margin.bottom)();
            let myDiameter = Math.round(fibonacci[Math.round(d3.randomUniform(4, 8)())]);
            nodes.push({ 'id': i, 'r': myDiameter / 2.3, 'x': myX, 'y': myY });
        }
        if (configuration.radiusRootNode && !rootNode) {
            rootNode = nodes[0];
            rootNode.fx = 615, //d3.randomUniform(configuration.margin.left, configuration.margin.right)();
                rootNode.fy = 250, //d3.randomUniform(configuration.margin.top, configuration.margin.bottom)();
                rootNode.r = configuration.radiusRootNode;
        }
    }

    let collideForce = d3.forceCollide(function(d) { return d.r + configuration.collisionMargin }).iterations(1);

    function ticked() {
        node.attr("cx", function(d) { return d.x = Math.max(configuration.margin.left + d.r, Math.min(configuration.margin.right - d.r, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(configuration.margin.top + d.r, Math.min(configuration.margin.bottom - d.r, d.y)); })
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

            node.exit().remove();

            node = node.enter().append("circle")
                .merge(node)
                .classed('node', true)
                .classed('is-inside', function(d) { return checkIfInside([d.x, d.y]) })
                .classed('root-node', function(d) { if (d.id == 0) { return true } else { return false } })
                .attr('cx', function(d) { return d.x; })
                .attr('cy', function(d) { return d.y; })
                .attr("r", 0);

            node.transition()
                .delay(function(d, i) {
                    return (3000 - i) / 3 + 300;
                })
                .duration(1000)
                .ease(d3.easeElasticOut)
                .attr('r', function(d) { return d.r; });

            d3.select('#logo-box h2').transition()
                .delay(500)
                .duration(1500)
                .style('opacity', 1)
                .style('letter-spacing', '.5px')

        }

        drawGraph();

        // Update and restart the simulation.
        simulation.nodes(nodes);
        simulation.alpha(1).restart();
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

    // Anticolllision on touch
    calogo.on("touchmove", function() {
        let p1 = d3.touches(this)[0];
        d3.event.preventDefault();
        if (rootNode) {
            rootNode.fx = p1[0];
            rootNode.fy = p1[1];
            simulation
                .alpha(1)
                .restart(); //reheat the simulation
        }
    });

    calogo.on("mouseleave", function() {
        d3.select('.root-node').transition()
            .duration(000)
            // .ease(d3.easePolyInOut)
            // .attr('cx', 615)
            // .attr('cy', 250)
            .on("end", function() {
                rootNode.fx = 615;
                rootNode.fy = 250;
            });
    });

    calogo.on("touchend", function() {
        d3.select('.root-node').transition()
            .duration(00)
            // .ease(d3.easePolyInOut)
            // .attr('cx', 615)
            // .attr('cy', 250)
            .on("end", function() {
                rootNode.fx = 615;
                rootNode.fy = 250;
            });
    });

    d3.select('body').on('keypress', function() {
        if (d3.event.keyCode == 100) {
            var file = new File([JSON.stringify(nodes, null, 2)], "nodes.json", { type: "application/json;charset=utf-8" });
            saveAs(file);
        } else if (d3.event.key == 'r') {
            nodes.forEach(function(d) {
                d.x = d3.randomUniform(configuration.margin.left, configuration.margin.right)();
                d.y = d3.randomUniform(configuration.margin.top, configuration.margin.bottom)();
                simulation.alpha(1).restart();
            })
        }
    })

    // addNodes(configuration.amountNodes);
    d3.json('./assets/bubbles.json', function(err, data) {
        nodes = data;
        rootNode = nodes[0];
        rootNode.fx = 615, //d3.randomUniform(configuration.margin.left, configuration.margin.right)();
            rootNode.fy = 250, //d3.randomUniform(configuration.margin.top, configuration.margin.bottom)();
            rootNode.r = configuration.radiusRootNode;
        nodes.push(nodes.splice(0, 1)[0]);
        update();
    })

}); // end of everything

function scrollTween(offset) {
    return function() {
        var i = d3.interpolateNumber(window.pageYOffset || document.documentElement.scrollTop, offset);
        return function(t) { scrollTo(0, i(t)); };
    };
}

d3.select(window).on('scroll', function() {
    if (window.pageYOffset >= window.innerHeight * .20) {
        d3.select('body').classed('navbar-displayed', true);
    } else {
        d3.select('body').classed('navbar-displayed', false);
    }
})

d3.select('#scroll-down').on('click', function() {
    d3.transition()
        .duration(1000)
        .ease(d3.easePolyInOut)
        .tween("scroll", scrollTween(window.innerHeight * .25));
})