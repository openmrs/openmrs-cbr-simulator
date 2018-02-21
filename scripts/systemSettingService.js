angular.module('systemSettingService', ['ngResource', 'simulator.common'])
    .factory('SystemSetting', function($resource) {
        return $resource(OPENMRS_CONTEXT_PATH  + "/ws/rest/v1/systemsetting/:uuid", {
            uuid: '@uuid'
        },{
            query: { method:'GET' }     // override query method to specify that it isn't an array that is returned
        });
    })
    .factory('SystemSettingService', function(SystemSetting) {
    	return {
    		getSystemSettings: function(params) {
                return SystemSetting.query(params).$promise;
    		}
    	}
	})