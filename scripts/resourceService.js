/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

angular.module('resourceService', ['ngResource'])

    .factory('ResourceService', function($resource) {

        return {

            getSystemSettingResource: function(server){
                return $resource(server.baseUrl + "/ws/rest/v1/systemsetting", {},
                {
                    query: {
                        method: 'GET',
                        isArray: false,  // OpenMRS RESTWS returns { "results": [] }
                        headers: getAuthorizationHeaders(server)
                    }
                });
            },

            getPersonResource: function(server) {
                return $resource(server.baseUrl + "/ws/rest/v1/person/:uuid", {
                    uuid: '@uuid'
                },
                {
                    query: {
                        method: 'GET',
                        isArray: false,
                        headers: getAuthorizationHeaders(server)
                    },
                    save: {
                        method: 'POST',
                        headers: getAuthorizationHeaders(server)
                    }
                });
            },

            getPatientResource: function(server) {
                return $resource(server.baseUrl + "/ws/rest/v1/patient", {},
                {
                    query: {
                        method: 'GET',
                        isArray: false,
                        headers: getAuthorizationHeaders(server)
                    },
                    save: {
                        method: 'POST',
                        headers: getAuthorizationHeaders(server)
                    }
                });
            },

            getObsResource: function(server) {
                return $resource(server.baseUrl + "/ws/rest/v1/obs", {},
                {
                    query: {
                        method: 'GET',
                        isArray: false,
                        headers: getAuthorizationHeaders(server)
                    },
                    save: {
                        method: 'POST',
                        headers: getAuthorizationHeaders(server)
                    }
                });
            }

        }

        function getAuthorizationHeaders(server){
            return {
                'Authorization': 'Basic '+server.credentials
            }
        }

    });