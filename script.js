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

// d3.select('body').classed('navbar-displayed', true);

d3.select('#scroll-down').on('click', function() {
    d3.transition()
        .duration(1000)
        .ease(d3.easePolyInOut)
        .tween("scroll", scrollTween(window.innerHeight * .40));
})