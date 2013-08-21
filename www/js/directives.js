'use strict';

/* Directives */
angular.module('myApp.directives', [])
    .directive('appVersion', ['version', function(version) {
        return function(scope, elm, attrs) {
          elm.text(version);
        }
    }])
    .directive('timeScroll', function($localStorage, $rootScope) {
        return function(scope, elm, attrs) {
            var times = eval('['+attrs.times+']');
            var timesNow = []; angular.forEach(times, function(t) {timesNow.push($localStorage[t])});
            var mins = [];
            angular.forEach(eval('['+(attrs.mins ? attrs.mins : '')+']'), function(m) {
                mins.push(m*1);
            });
            var conf = {preset: 'rounds',
                timeWheels: attrs.timeWheels,
                times: timesNow,
                mins: mins,
                onSelect: function(time) {
                    angular.forEach(times, function(name, i) {
                        $localStorage[name] = time[i];
                    });
                    $rootScope.$broadcast('yoba.timeChanged');
                }
            };
            if (attrs.secText) conf['secText'] = attrs.secText;
            if (attrs.secText2) conf['secText2'] = attrs.secText2;
            elm.mobiscroll(conf);
        }
    });
