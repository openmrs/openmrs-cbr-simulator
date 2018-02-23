angular.module('systemSettingService', ['resourceService'])

    .factory('SystemSettingService', function(ResourceService) {
    	return {
    		getSystemSettings: function(server) {
                var params = {q: 'casereport.identifierTypeUuid', v: 'full'};
                return ResourceService.getSystemSettingResource(server).query(params).$promise;
    		}
    	}
	})