/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

angular.module('personService', ['ngResource', 'simulator.common'])
    .factory('Person', function($resource) {
        return $resource(OPENMRS_CONTEXT_PATH  + "/ws/rest/v1/person/:uuid", {
            uuid: '@uuid'
        },{
            query: { method:'GET', isArray:false } // OpenMRS RESTWS returns { "results": [] }
        });
    })
    .factory('PersonService', function(Person) {

        return {

            /**
             * Fetches Persons
             *
             * @param params to search against
             * @returns $promise of array of matching Persons (REST ref representation by default)
             */
            getPersons: function(params) {
                return Person.query(params).$promise.then(function(res) {
                    return res.results;
                });
            }
        }
    });