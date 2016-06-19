/*
 * Copyright (c) 2016, tsntsumi
 * Released under MIT license.
 */

/*
Flot plugin for bandwidth bars on plot canvas.

Available options are:
series: {
    extents: {
        show: boolean -- enable plugin for given data series (false).
        lineWidth: number -- The linewidth of a bandwidth bar (3).
        barWidth: number -- The width of a bandwidth bar (6).
        fill: boolean/number -- whether the shape should be filled.   
        fillColor: -- color of the fill.
    }
}

Data array specific for BandWidth chart is:
data: [
    [ Y-Value, X-Hight-Value, X-Low-Value ],
    ...
]
 */

(function ($) {
    var options = {
        series: {
            bandwidth: {
                show: false,
                lineWidth: 3,
                barWidth: 6,
                fill: 1.0,
                fillColor: null
            }
        }
    };

    function init(plot) {
        function drawSeries(plot, ctx, series) {
            function plotBandwidth(datapoints, width, lineWidth, fillColor, offset, xaxis, yaxis) {
                var points = datapoints.points, ps = datapoints.pointsize;
                for (var i = 0; i < points.length; i += ps) {
                    var x = points[i], top = points[i+1], bottom = points[i+2];
                    if (x == null || x < xaxis.min || x > xaxis.max ||
                        bottom < yaxis.min || top > yaxis.max) {
                            continue;
                    }
                    ctx.beginPath();
                    x = xaxis.p2c(x) + offset;
                    top = yaxis.p2c(top) + offset;
                    bottom = yaxis.p2c(bottom) + offset;
                    ctx.arc(x, top, width / 2, Math.PI, Math.PI * 2, false);
                    ctx.lineTo(x + width / 2, bottom);
                    ctx.arc(x, bottom, width / 2, 0, Math.PI, false);
                    ctx.closePath();
                    if (fillColor) {
                        var fillStyle = getColorOrGradient(fillColor, bottom, top);
                        ctx.fillStyle = fillStyle;
                        ctx.fill();
                    }
                    ctx.stroke();
                }
            }

            function getFillColor(filloptions, seriesColor) {
                var fill = filloptions.fill;
                if (!fill)
                    return null;

                if (filloptions.fillColor)
                    return filloptions.fillColor;

                var c = $.color.parse(seriesColor);
                c.a = typeof fill == "number" ? fill : 0.8;
                c.normalize();
                return c.toString();
            }

            function getColorOrGradient(spec, bottom, top) {
                if (typeof spec == "string")
                    return spec;
                else {
                    var gradient = ctx.createLinearGradient(0, top, 0, bottom);

                    for (var i = 0, l = spec.colors.length; i < l; ++i) {
                        var c = spec.colors[i];
                        if (typeof c == "string") {
                            gradient.addColorStop(i / (l - 1), c);
                        }
                    }

                    return gradient;
                }
            }

            if (!series.bandwidth || !series.bandwidth.show) {
                return;
            }

            var plotOffset = plot.getPlotOffset();

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            var points = series.data,
                lineWidth = series.bandwidth.lineWidth,
                barWidth = series.bandwidth.barWidth,
                fillColor = getFillColor(series.bandwidth, series.color),
                shadowSize = series.shadowSize;
            if (lineWidth == 0) {
                lineWidth = 0.001;
            }
            if (lineWidth > 0 && shadowSize > 0) {
                // draw shadow
                var shadowColor = "rgba(0,0,0,0.2)";
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = shadowColor;
                plotBandwidth(series.datapoints, barWidth, lineWidth, shadowColor, shadowSize, series.xaxis, series.yaxis);
            }
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = series.color;
            plotBandwidth(series.datapoints, barWidth, lineWidth, fillColor, 0, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function processRawData(plot, series, data, datapoints) {
            if (!series.bandwidth || !series.bandwidth.show) {
                return;
            }
            datapoints.format = [
                { x: true, number: true, required: true, autoscale: true },
                { y: true, number: true, required: true, autoscale: true },
                { y: true, number: true, required: true, autoscale: true }
            ];
        }

        plot.hooks.drawSeries.push(drawSeries);
        plot.hooks.processRawData.push(processRawData);
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'bandwidth',
        version: '1.0.0'
    });
})(jQuery);