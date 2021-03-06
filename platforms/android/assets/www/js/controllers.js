'use strict';

/* Controllers */
// phonegapReady should be included in main controller in order to initialization before phonegapready event fired
function HomeCtrl(phonegapReady,$scope,navSvc,$rootScope,$localStorage,timerTypesSvc,storageSvc,overlaySvc,timeSvc,sleepSvc) {
    var slidePage = function (path,type) {
        navSvc.slidePage(path,type);
    };
    $scope.start = function () {
        slidePage('/runRounds');
    };

    $scope.changeSettings = function () {
        $rootScope.showSettings = true;
    };
    $scope.selectTimerTypeDialog = function () {
        $rootScope.showTimerTypeDoalog = true;
    };

    $scope.timerTypes = timerTypesSvc.all;
    $scope.timerTypesSvc = timerTypesSvc;
    $scope.timerType = $localStorage.timerType;
    $scope.settingsInvalid = function() {
        if (!timerTypesSvc.notRounds() && timeSvc.roundTime().unix() == 0) {
            $scope.settingsErrorMessage = "Round time shouldn't be zero";
            return true;
        } else if (!timerTypesSvc.notRounds() && timeSvc.restTime().unix() == 0) {
            $scope.settingsErrorMessage = "Rest time shouldn't be zero";
            return true;
        } else {
            $scope.settingsErrorMessage = undefined;
            return false;
        }
    };
    $scope.setTimerType = function(timerType) {
        $rootScope.oldTimerType=$localStorage.timerType;
        $rootScope.timerType = timerType;
        $localStorage.timerType = timerType;
        $rootScope.closeOverlay();
    };
}

function RunRoundsCtrl($scope,navSvc,$localStorage,$timeout,audioSvc,timeSvc,$q,timerTypesSvc,sleepSvc) {
    function resetRoundTimeLeft() {
      $scope.roundTimeLeft = timeSvc.roundTime();
    }
    function resetRestTimeLeft() {
      $scope.restTimeLeft = timeSvc.restTime();
    }
    function init() {
        resetRoundTimeLeft();
        $scope.roundTimeSpent = moment(0);
        $scope.roundTime = timeSvc.roundTime();
        $scope.complex = timerTypesSvc.isComplex();
        resetRestTimeLeft();
        $scope.roundsLeft = $localStorage.rounds;
        $scope.round = 1;
        $scope.prepareSeconds = 0;
        $scope.work = false;
        $scope.rest = false;
        var ivals = function () {
          if ($localStorage.timerType == timerTypesSvc.complex) { // interval
            // compute intervals
            var start = moment(0);
            var end = timeSvc.roundTime();
            var r = [];
            while (start < end) {
              start.add(timeSvc.relaxedTime().unix()*1000);
              r.push(start.clone());
              start.add(timeSvc.intensiveTime().unix()*1000);
              r.push(start.clone());
            }
            return r
          } else {
            return [];
          }
        }();
        var timeout;
        var countDown = function () {
          $scope.started = true;
          $scope.relaxed = true;
          function countDownRound() {
            var intervals = ivals.slice(0); //shallow;
            var nextInterval = intervals.shift();
            var d = $q.defer();
            //check pause case
            if ($scope.rest) {
              d.resolve();
              return d.promise;
            }
            $scope.work = true;
            timeout = $timeout((function cdr () {
              $scope.roundTimeLeft.subtract(1000);
              $scope.roundTimeSpent.add(1000);
              if (nextInterval && $scope.roundTimeSpent.unix() == nextInterval.unix()) {
                nextInterval = intervals.shift();
                $scope.relaxed = !$scope.relaxed;
                if ($scope.roundTimeLeft.unix() > 0) {
                  audioSvc.playTick();
                }
              }
              if ($scope.roundTimeLeft.unix() == 0) {
                resetRoundTimeLeft();
                $scope.roundTimeSpent = moment(0);
                d.resolve();
              } else {
                if ($scope.roundTimeLeft.unix() < 4) {
                  audioSvc.playTick();
                }
                timeout = $timeout(cdr, 1000);
              }
            }), 1000);
            return d.promise;
          }
          function countDownRest() {
            var d = $q.defer();
            $scope.rest = true;
            timeout = $timeout((function cdr () {
              $scope.restTimeLeft.subtract(1000);
              if ($scope.restTimeLeft.unix() == 0) {
                resetRestTimeLeft();
                d.resolve();
              } else {
                if ($scope.restTimeLeft.unix() < 3) {
                  audioSvc.playTick();
                }
                timeout = $timeout(cdr, 1000);
              }
            }), 1000);
            return d.promise;
          }
          countDownRound().then(function () {
            $scope.work = false;
            //do not rest in last round
            if ($scope.roundsLeft == 1) {
              audioSvc.playBell3();
              navSvc.back();
            } else {
              audioSvc.playBell1();
              countDownRest().then(function () {
                audioSvc.playBell1();
                $scope.rest = false;
                $scope.roundsLeft--;
                $scope.round++;
                countDown();
              });
            }
          })
        };
        var prepareTimer = function () {
          if ($scope.prepareSeconds <= 0) {
            audioSvc.playBell3();
            countDown();
          } else {
            $scope.prepareSeconds--;
            audioSvc.playTick();
            timeout = $timeout(prepareTimer, 1500);
          }
        };
        timeout = $timeout(prepareTimer, 2000);
        $scope.back = function () {
          navSvc.back();
        };
        $scope.pause = function () {
          $scope.paused = true;
          $timeout.cancel(timeout);
        };
        $scope.resume = function () {
          $scope.paused = false;
          $scope.started = true;
          countDown();
        };
        $scope.$on('$destroy', function(){
          sleepSvc.release(function() {
            if (timeout) { $timeout.cancel(timeout) }
          });
        });
    }
    sleepSvc.acquire(init);

}

function RunTimerCtrl($scope,navSvc,$localStorage,timerTypesSvc,timeSvc,$timeout,$rootScope,audioSvc,sleepSvc) {
    var timeout;
    var tick;
    var flush;
    var init = function() {
        $scope.snapshots = [];
        if (timerTypesSvc.isCountdown()) {
            flush = function(isStop) {
                if (isStop) $scope.snapshot();
                $scope.time = timeSvc.timerTime();
            };
            $rootScope.$on('yoba.timeChanged', function(){flush()}); // it is important to keep no-argument here
            flush();
            tick = function() {
                timeout = $timeout(function() {
                    if ($scope.time.valueOf() == 0) {
                        audioSvc.playBell1();
                        stopTimer();
                    } else {
                        $scope.time.subtract(100);
                        tick();
                    }
                },100);
            };
        } else { // is timer
            flush = function(isStop) {
                if (isStop) $scope.snapshot();
                $scope.time = moment(0);
            };
            flush();
            tick = function() {
                timeout = $timeout(function() {
                    $scope.time.add(100);
                    tick();
                },100);
            };
        }
    };
    $scope.start = function() {
        $rootScope.started = true;
        $scope.snapshots = [];
        sleepSvc.acquire(tick);
    };
    $scope.stop = function() {
        stopTimer(true);
        $timeout.cancel(timeout);
    };
    function stopTimer(isStopButton) {
        $rootScope.paused = false;
        $rootScope.started = false;
        sleepSvc.release();
        flush(isStopButton);
    }
    $scope.$on('$destroy', function() {
        if (timeout) { $timeout.cancel(timeout) }
    });
    $scope.pause = function() {
        $rootScope.paused = true;
        $timeout.cancel(timeout);
    };
    $scope.resume = function() {
        $rootScope.paused = false;
        $rootScope.started = true;
        tick();
    };
    $scope.snapshot = function() {
        $scope.snapshots.push($scope.time.clone());
    };
    init();
    $rootScope.$watch('timerType', function(value) {
        if (value == timerTypesSvc.timer || value == timerTypesSvc.countdown) {
            init();
        }
    });
}

function DeviceCtrl($scope) {
    $scope.device = device;
}

function SettingsCtrl($scope,overlaySvc) {
    $scope.closeApplication = function() {
      navigator.app.exitApp();
    }
}





                     