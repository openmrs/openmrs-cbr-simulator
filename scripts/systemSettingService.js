angular.module('systemSettingService', ['resourceService'])

    .factory('SystemSettingService', function(ResourceService) {
    	return {
    		getSystemSettings: function(baseUrl, params) {
                return ResourceService.getSystemSettingResource(baseUrl).query(params).$promise;
    		}
    	}
	})