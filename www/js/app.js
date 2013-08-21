'use strict';


// Declare app level module which depends on filters, and services
var myApp = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives','ajoslin.mobile-navigate','ngMobile','ngStorage'])
    .config(function ($compileProvider){
        $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
    })
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {templateUrl: 'partials/homeView.html', controller: 'HomeCtrl'});
        $routeProvider.when('/runRounds', {templateUrl: 'partials/runRoundsView.html'});
        $routeProvider.when('/runTimer', {templateUrl: 'partials/runTimerView.html'});
        $routeProvider.otherwise({redirectTo: '/'});
    }]).run(function(phonegapReady) {});
