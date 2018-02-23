/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */


/*============== GLOBAL VARIABLES =================*/

var credentialsKey = 'CREDENTIALS_KEY';

var EventResult = {
    SKIP: "skip",
    SUCCESS: "success",
    FAIL: "fail"
}

/*============== END GLOBAL VARIABLES =============*/

angular.module("casereport.simulator.boot", [])

    .controller("BootController", ["$scope",

        function($scope){
            window.setTimeout(function(){

                angular.bootstrap("#casereport-simulator", ["casereport.simulator"]);
                $("#casereport-simulator-boot").hide();
                $("#casereport-simulator").show();

            }, 20);
        }

    ]);

angular.module("casereport.simulator", [
        "simulator.filters",
        "simulationService",
        "systemSettingService",
    ])

    .controller("SimulatorController", ["$scope", "$filter", "SimulationService" , "SystemSettingService", "ResourceService",

        function($scope, $filter, SimulationService, SystemSettingService, ResourceService){
            $scope.dataset = dataset;
            $scope.showConsole = false;
            $scope.isRunning = false;
            $scope.skipFailedEvents = true;
            $scope.artStartConceptUuid = '1255AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.startDrugsConceptUuid = '1256AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.reasonArtStoppedConceptUuid = '1252AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.weightChangeConceptUuid = '983AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.idPatientUuidMap = {};
            $scope.executedEventIndex = -1;
            $scope.nextEventIndex = 0;
            $scope.eventCount = $scope.dataset.timeline.length;
            $scope.servers = config.openmrsInstances;
            $scope.serverIdPasswordMap = {};
            $scope.serverIdentifierTypeMap = {};
            $scope.serverCheckedForIdType = {};
            
            for(var i in config.openmrsInstances) {
                var server = config.openmrsInstances[i];
                $scope.serverIdPasswordMap[server.id] = null;
                //$scope.serverCheckedForIdType[server.id] = false;
            }

            $scope.run = function(){
                $scope.isRunning = true;
                $scope.showConsole = true;
                runTimeline(true);
            }

            $scope.canRun = function(){
                return !$scope.isRunning;
            }

            $scope.setCredentials = function(){
                var credentialsMap = {};
                for(var i in config.openmrsInstances){
                    var server = config.openmrsInstances[i];
                    var password = $scope.serverIdPasswordMap[server.id];
                    credentialsMap[server.id] = btoa(server.username+":"+password);
                }

                window.sessionStorage.setItem(credentialsKey, credentialsMap);
            }

            $scope.areCredentialsSet = function(){
                return getCredentials() != null;
            }

            $scope.displayEvent = function(event) {
                var patient = getPatientById(event.identifier);
                var name = patient.givenName + " " + patient.middleName + " " + patient.familyName;
                var date = $scope.formatDate(convertToDate(event.date), 'dd-MMM-yyyy');
                return getEventLabel(event) + " " + name + " on " + date;
            }

            function runTimeline(resetConsole){
                if(resetConsole){
                    resetLogs();
                }
                
                logMessage('Run timeline events...');
                logMessage('');
                processNextEvent();
            }

            function getEventLabel(event){
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

            function getPatientById(id){
                for (var i in $scope.dataset.patients){
                    var patient = $scope.dataset.patients[i];
                    if(id == patient.identifier){
                        return patient;
                    }
                }

                throw Error("No Patient found with id: "+id);
            }

            $scope.formatDate = function(date, format){
                if(!format){
                    format = 'dd-MMM-yyyy';
                }
                return $filter('serverDate')(date, format);
            }

            function convertToDate(offSetInDays){
                return moment().add(offSetInDays, 'days').format('YYYY-MM-DD');
            }

            $scope.buildPatient = function(patientData, server){
                var birthDateStr = $scope.formatDate(convertToDate(patientData.birthdate), 'yyyy-MM-dd');

                var person = {
                    birthdate: birthDateStr,
                    gender: patientData.gender,
                    names: [
                        {
                            givenName: patientData.givenName,
                            middleName: patientData.middleName,
                            familyName: patientData.familyName
                        }
                    ]
                }

                var identifier =  {
                    identifier: patientData.identifier,
                    identifierType: $scope.serverIdentifierTypeMap[server.id]
                }

                return {
                    person: person,
                    identifiers: [identifier]
                }

            }

            function processNextEvent(){
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                var patientId = eventData.identifier;
                var patientUuid = $scope.idPatientUuidMap[patientId];
                var server = getServer();
                var baseUrl = server.baseUrl;
                if(!patientUuid) {
                    var patientData = getPatientById(patientId);
                    SimulationService.getPatientByIdentifier(baseUrl, patientId).then(function(response){
                        var results = response.results;
                        if(results.length == 0){
                            //First register the patient
                            var params = {q: 'casereport.identifierTypeUuid', v: 'full'};
                            if(!$scope.serverIdentifierTypeMap[server.id]) {
                                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                                if(!$scope.serverCheckedForIdType[server.id]) {
                                    SystemSettingService.getSystemSettings(baseUrl, params).then(function (response) {
                                        var results = response.results;
                                        if (results.length == 1 && results[0].value != null) {
                                            $scope.serverIdentifierTypeMap[server.id] = results[0].value;
                                            registerPatient(patientData, patientId, server);
                                        } else {
                                            logError('No enterprise identifier type specified for server: ' + getServerDisplay(server));
                                            $scope.serverCheckedForIdType[server.id] = true;
                                            postEventResultHandler(EventResult.SKIP, eventData);
                                        }
                                    });
                                }else{
                                    postEventResultHandler(EventResult.SKIP, eventData);
                                }
                            }else{
                                registerPatient(patientData, patientId, server);
                            }
                        }else if(results.length > 1){
                            var errorMsg = "Found multiple patients with the identifier: "+patientId+" at "+getServerDisplay(server);
                            logError(errorMsg);
                            throw Error(errorMsg);
                        }else {
                            $scope.idPatientUuidMap[patientId] = results[0].uuid;
                            createEvent(server);
                        }
                    });
                }else{
                    createEvent(server);
                }
            }

            function getServer(){
                var servers = config.openmrsInstances;
                return servers[Math.floor(Math.random() * servers.length)];
            }

            function getServerDisplay(server){
                return server.name+" ("+server.id+")";
            }

            function registerPatient(patientData, identifier, server){
                logRegisterPatient(patientData, server);
                var patient = $scope.buildPatient(patientData, server);
                ResourceService.getPatientResource(server.baseUrl).save(patient).$promise.then(function (savedPatient) {
                    $scope.idPatientUuidMap[identifier] = savedPatient.uuid;
                    createEvent(server);
                });
            }

            function createEvent(server){
                logEvent(server);
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                var patientUuid = $scope.idPatientUuidMap[eventData.identifier];

                if (eventData.event == "death"){
                    var person =  {
                        uuid: patientUuid,
                        dead: true,
                        deathDate: getFormattedDate(eventData.date),
                        causeOfDeath: '125574AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
                    }
                    ResourceService.getPersonResource(server.baseUrl).save(person).$promise.then(function(){
                        postEventResultHandler(EventResult.SUCCESS, eventData);
                    });
                } else {
                    var obs = buildObs(eventData, $scope.idPatientUuidMap[eventData.identifier]);
                    ResourceService.getObsResource(server.baseUrl).save(obs).$promise.then(function () {
                        postEventResultHandler(EventResult.SUCCESS, eventData);
                    });
                }
            }

            function getFormattedDate(dateStr){
                return $scope.formatDate(convertToDate(dateStr), 'yyyy-MM-dd');
            }

            function postEventResultHandler(result, eventData){
                if(result === EventResult.SKIP){
                    if ($scope.skipFailedEvents) {
                        logWarning("Skipping: " + $scope.displayEvent(eventData));
                    }
                }

                $scope.nextEventIndex++;
                if ($scope.nextEventIndex == $scope.eventCount) {
                    finalizeRunEvents();
                }else{
                    processNextEvent();
                }
            }

            function buildObs(eventData, patientUuid) {
                var obsDate = getFormattedDate(eventData.date);
                var questionConcept = getObsConcept(eventData);
                var obsValue = eventData.value;
                if (questionConcept == $scope.artStartConceptUuid){
                    obsValue = $scope.startDrugsConceptUuid;
                }else if (questionConcept == $scope.reasonArtStoppedConceptUuid){
                    obsValue = $scope.weightChangeConceptUuid;
                }

                return {
                    person : patientUuid,
                    concept: questionConcept,
                    value: obsValue,
                    obsDatetime: obsDate
                }
            }

            function getObsConcept(eventData){
                switch(eventData.event){
                    case 'artStartDate': {
                        return $scope.artStartConceptUuid;
                    }
                    case 'cd4Count': {
                        return '5497AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
                    }
                    case 'viralLoad': {
                        return '856AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
                    }
                    case 'reasonArtStopped': {
                        return $scope.reasonArtStoppedConceptUuid;
                    }
                }

                throw Error("Unknown concept for event "+$scope.displayEvent(eventData));
            }

            function logMessage(msg){
                var ele = document.querySelector('#console');
                angular.element(ele).append('> '+msg+'<br>');
            }

            function logWarning(warningMsg){
                var ele = document.querySelector('#console');
                angular.element(ele).append('> <span class="warning-msg">'+warningMsg+'</span><br>');
            }

            function logError(errorMsg){
                var ele = document.querySelector('#console');
                angular.element(ele).append('> <span class="error-msg">'+errorMsg+'</span><br>');
            }

            function resetLogs(){
                var ele = document.querySelector('#console');
                angular.element(ele).html('');
            }

            function logEvent(server){
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                logMessage($scope.displayEvent(eventData)+" at "+server.name);
            }

            function finalizeRunEvents(){
                $scope.isRunning = false;
                $scope.nextEventIndex = 0;
                //Reset for the user to be able to rerun
                logMessage('');
                logMessage('Done!');
            }

            function logRegisterPatient(patient, server){
                var name = patient.givenName+" "+patient.middleName+" "+patient.familyName;
                logMessage("Registering patient: "+name+" at "+server.name);
            }

        }

    ]);


/*============== GLOBAL FUNCTIONS =================*/

function getCredentials(){
    return window.sessionStorage.getItem(credentialsKey);
}
