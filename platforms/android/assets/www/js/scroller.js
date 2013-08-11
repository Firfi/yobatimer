(function ($) {

    var defaults = {
        // Default options for the preset
        def1: 2,
        def2: 'test'
    }

    $.mobiscroll.presets.mypreset = function(inst) {
        var orig = $.extend({}, inst.settings), // Make a copy of the original settings
            s = $.extend(inst.settings, defaults, orig), // Extend settings with preset defaults
            wheels = {},
            value = 0,
        // Create custom wheels
            elm = $(this);
        // 'this' refers to the DOM element on which the plugin is called

        // Custom preset logic which is executed
        // when the scroller instance is created,
        // e.g. create the custom wheels

        return {
            // Typically a preset defines the 'wheels', 'formatResult', and 'parseValue' settings
            wheels: wheels,
            formatResult: function(d) {
                return value;
            },
            parseValue: function() {
                return [elm.val()];
            },
            // The preset may override any other core settings
            headerText: false
        }
    }

    // Add this line if you want to be able to use your preset like
    // $('#selector').mobiscroll().mypreset() as a shorthand for
    // $('#selector').mobiscroll({ preset: 'mypreset' })
    $.mobiscroll.presetShort('mypreset');

})(jQuery);