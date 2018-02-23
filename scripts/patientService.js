/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

angular.module('patientService', ['resourceService'])

    .factory('PatientService', function(ResourceService) {

        return {
            savePatient: function(server, params) {
                return ResourceService.getPatientResource(server).save(params).$promise;
            },

            getPatientByIdentifier: function(server, id) {
                var params = {s: "patientByIdentifier", identifier: id, v: "custom:(uuid,patientIdentifier:(identifier))"};
                return ResourceService.getPatientResource(server).query(params).$promise;
            }
        }

    });