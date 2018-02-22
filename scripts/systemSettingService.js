angular.module('systemSettingService', ['ngResource', 'simulator.common', 'resourceService'])

    .factory('SystemSettingService', function(ResourceService) {
    	return {
    		getSystemSettings: function(baseUrl, params) {
                return ResourceService.getSystemSettingResource(baseUrl).query(params).$promise;
    		}
    	}
	})