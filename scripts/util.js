/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

var credentialsKey = 'CREDENTIALS_KEY';

var Util = {

    getCredentials: function (){
        return JSON.parse(sessionStorage.getItem(credentialsKey));
    },

    setCredentials: function (credentialsMap) {
        sessionStorage.setItem(credentialsKey, JSON.stringify(credentialsMap));
    },

    getPatientDisplay: function (patient) {
        return patient.givenName+" "+patient.middleName+" "+patient.familyName;
    },

    logRegisterPatient: function (patient, server){
        Console.info("Registering patient: "+this.getPatientDisplay(patient)+" at "+server.name);
    },

    getEventLabelPrefix: function (event){
        switch(event.event){
            case 'artStartDate': {
                return "Start ART for";
            }
            case 'cd4Count': {
                return "CD4 Count of "+event.value+" for";
            }
            case 'viralLoad': {
                return "Viral Load of "+event.value+" for";
            }
            case 'reasonArtStopped': {
                return "Stop ART because of weight change for";
            }
            case 'death': {
                return "Death of";
            }
        }
    }
    
};