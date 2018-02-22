angular.module('simulator.common', [])

    .config(function($httpProvider) {
        var openmrsInstance = config.openmrsInstances[0];
        var userAndPass =  btoa(openmrsInstance.username+":"+openmrsInstance.password);
        $httpProvider.defaults.headers.common['Authorization'] = 'Basic '+userAndPass;
    }); 