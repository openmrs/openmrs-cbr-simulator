angular.module('simulator.common', [])

    .config(function($httpProvider) {
        $httpProvider.defaults.headers.common['Authorization'] = 'Basic some-password';
    });