/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

angular.module('simulator.filters', []).

    /*
     * Angular's "date" filter displays the date in the client's timezone. This filter assumes that the ISO-formatted
     * time string passed in is in the server's timezone, and drops timezone information before formatting it.
     */
    filter('serverDate', ['$filter', function($filter) {
        return function(isoString, format) {
            if (!isoString) {
                return null;
            }
            if (isoString.length > 23) {
                isoString = isoString.substring(0, 23);
            }
            return $filter('date')(isoString, format || "dd-MMM-yyyy H:mm");
        }
    }])