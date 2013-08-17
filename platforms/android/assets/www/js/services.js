'use strict';

/* Services */

// Simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');

myApp.factory('storage', function() {
    return window.localStorage;
});

myApp.factory('agent', function() {
    return {
        isBrowser: function() {
            return window.tinyHippos != undefined;
        }
    }
});

// phonegap ready service - listens to deviceready
myApp.factory('phonegapReady', function ($rootScope, $q) {
    var loadingDeferred = $q.defer();
    document.addEventListener('deviceready', function() {
        $rootScope.$apply(loadingDeferred.resolve);
    });
    return function phonegapReady() {
        return loadingDeferred.promise;
    };
});

myApp.factory('audioSvc', function(agent,$timeout,phonegapReady) {
    var localPlay = null;
    var promise = phonegapReady().then(function () {
//        function getPhoneGapPath(p) {
//            var path = window.location.pathname;
//            path = path.substr(path, path.length - 10);
//            return "file://" + path + p;
//        }
        localPlay = function(id) {
            var play;
            if (agent.isBrowser()) {
              play = function() { console.info('playing sound: ' + id + ' at ' + moment().format('mm:ss.SSS')) };
            } else {
              play = function() { PGLowLatencyAudio.play(id) }
            }
            return {play: play};
        };
        try {
          PGLowLatencyAudio.preloadFX('beep', 'beep.wav');
          PGLowLatencyAudio.preloadFX('bell1', 'bell1.wav');
          PGLowLatencyAudio.preloadFX('bell3', 'bell3.wav');
        } catch(e) {
          if (!agent.isBrowser()) {
            alert(e);
          }
        }

    });

    return {
        playTick: function() {promise.then(function() {
          localPlay('beep').play();
        })},
        playBell1: function() {promise.then(function() {
          localPlay('bell1').play();
        })},
        playBell3: function() {promise.then(function() {
          localPlay('bell3').play();
        })}
    }

});

myApp.factory('navSvc', function($navigate) {
    return {
        slidePage: function (path,type) {
            $navigate.go(path,type);
        },
        back: function () {
            $navigate.back();
        }
    }
});

myApp.factory('timeSvc', function($localStorage) {
    return {
        roundTime: function () {
            return moment(1000*($localStorage.roundMinutes*60 + $localStorage.roundSeconds*1));
        },
        restTime: function () {
            return moment(1000*($localStorage.restMinutes*60 + $localStorage.restSeconds*1));
        },
        relaxedTime: function () {
            return moment(1000*$localStorage.relaxedSeconds);
        },
        intensiveTime: function () {
            return moment(1000*$localStorage.intensiveSeconds);
        },
        timerTime: function () {
            return moment(1000*($localStorage.timerMinutes*60 + $localStorage.timerSeconds*1));
        }
    }
});

myApp.factory('timerTypesSvc', function($localStorage) {
    var simple = 'simple'; var complex = 'complex'; var timer = 'timer'; var countdown = 'countdown';
    var all = [simple, complex, timer, countdown];
    return {
        all: all,
        simple: simple,
        complex: complex,
        timer: timer,
        countdown: countdown,
        isSimple: function() {return $localStorage.timerType == simple},
        isComplex: function() {return $localStorage.timerType == complex},
        isTimer: function() {return $localStorage.timerType == timer},
        isCountdown: function() {return $localStorage.timerType == countdown},
        notRounds: function() {return $localStorage.timerType != simple && $localStorage.timerType != complex}
    }
});

myApp.factory('storageSvc', function($rootScope, $localStorage, timerTypesSvc) {
    $rootScope.$storage = $localStorage.$default({
        timerType: timerTypesSvc.simple,
        rounds: '5',
        roundMinutes: '3',
        roundSeconds: '0',
        restMinutes: '1',
        restSeconds: '0',
        intensiveSeconds: '20',
        relaxedSeconds: '20',
        timerMinutes: '0',
        timerSeconds: '30',
        countdownMinutes: '0',
        countdownSeconds: '30'
    });
});

myApp.factory('overlaySvc', function($rootScope) {
    $rootScope.closeOverlay = function () {
        $rootScope.showSettings = false;
        $rootScope.showTimerTypeDoalog = false;
    };
    $rootScope.closeOverlay();
});
