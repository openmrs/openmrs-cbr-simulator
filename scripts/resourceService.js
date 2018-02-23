/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

angular.module('resourceService', ['ngResource', 'simulator.common'])

    .factory('ResourceService', function($resource) {

        return {

            getSystemSettingResource: function(baseUrl){
                return $resource(baseUrl + "/ws/rest/v1/systemsetting/:uuid", {
                    uuid: '@uuid'
                },{
                    query: { method:'GET' } // OpenMRS RESTWS returns { "results": [] }
                });
            },

            getPersonResource: function(baseUrl) {
                return $resource(baseUrl + "/ws/rest/v1/person/:uuid", {
                    uuid: '@uuid'
                },{
                    query: { method:'GET', isArray: false }
                });
            },

            getPatientResource: function(baseUrl) {
                return $resource(baseUrl + "/ws/rest/v1/patient/:uuid", {
                },{
                    query: { method:'GET' }
                });
            },

            getObsResource: function(baseUrl) {
                return $resource(baseUrl + "/ws/rest/v1/obs/:uuid", {
                    uuid: '@uuid'
                },{
                    query: { method:'GET', isArray: false }
                });
            }

        }

    });