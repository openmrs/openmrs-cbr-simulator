/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

angular.module('obsService', ['ngResource', 'simulator.common'])
    .factory('Obs', function($resource) {
        return $resource(OPENMRS_CONTEXT_PATH  + "/ws/rest/v1/obs/:uuid", {
            uuid: '@uuid'
        },{
            query: { method:'GET', isArray:false } // OpenMRS RESTWS returns { "results": [] }
        });
    })
    .factory('ObsService', function(Obs) {

        return {

            /**
             * Fetches Obs
             *
             * @param params to search against
             * @returns $promise of array of matching Obs (REST ref representation by default)
             */
            getObs: function(params) {
                return Obs.query(params).$promise.then(function(res) {
                    return res.results;
                });
            }
        }
    });