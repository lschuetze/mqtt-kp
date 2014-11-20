/*
 * linechart specific file
 * Chart will be created the moment the window loads
 * more specific functions such as addData to be added later
 */

var chart = function() {

    var _myLineChart;

    $(window).on('load', function() {
        _myLineChart = _createChart();

    });

    //Idea: Create new chart every time the window resizes. Question is, will the data be stored or will it be lost on redrawing?
    $(window).on('resize', function() {
        // _myLineChart = _createChart();
    });


    var _createChart = function() {
        var ctx = document.getElementById("myChart").getContext("2d");
        ctx.canvas.width = $('#graph').width();
        ctx.canvas.height = $('#graph').height();
        var _myLineChart = new Chart(ctx).Line(chartconfig.data, chartconfig.options);
        return _myLineChart;
    };

    return {
        createChart: _createChart,
        lineChart: _myLineChart
    };


}();