/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

angular.module("casereport.simulator.boot", [])

    .controller("BootController", ["$scope",

        function($scope){
            window.setTimeout(function(){

                angular.bootstrap("#casereport-simulator", ["casereport.simulator"]);
                $("#casereport-simulator-boot").hide();
                $("#casereport-simulator").show();

            }, 30);
        }

    ]);

angular.module("casereport.simulator", [
        "simulator.filters",
        "simulationService",
        "systemSettingService",
        "obsService",
        "personService"
    ])

    .run(function($rootScope, SystemSettingService){
        var params = {q: 'casereport.identifierTypeUuid', v: 'full'};
        SystemSettingService.getSystemSettings(OPENMRS_CONTEXT_PATH, params).then(function(response){
            var results = response.results;
            if(results.length == 1 && results[0].value != null) {
                $rootScope.identifierType = results[0].value;
            } else {
                alert('No enterprise identifier type specified');
            }
        });

    })

    .controller("SimulatorController", ["$rootScope", "$scope", "$filter", "SimulationService", "Person", "Patient", "Obs",

        function($rootScope, $scope, $filter, SimulationService, Person, Patient, Obs){
            $scope.dataset = dataset;
            $scope.showConsole = false;
            $scope.artStartConceptUuid = '1255AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.startDrugsConceptUuid = '1256AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.reasonArtStoppedConceptUuid = '1252AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.weightChangeConceptUuid = '983AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.idPatientUuidMap = {};
            $scope.executedEventIndex = -1;
            $scope.nextEventIndex = 0;
            $scope.eventCount = $scope.dataset.timeline.length;

            $scope.run = function(){
                $scope.showConsole = true;
                runTimeline(true);
            }

            $scope.canRun = function(){
                return $scope.identifierType != undefined;
            }

            $scope.displayEvent = function(event){
                var patient = getPatientById(event.identifier);
                var name = patient.givenName+" "+patient.middleName+" "+patient.familyName;
                var date = $scope.formatDate(convertToDate(event.date), 'dd-MMM-yyyy');
                return getEventLabel(event)+" "+name+" on "+date;
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

            $scope.buildPatient = function(patientData){
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
                    identifierType: $rootScope.identifierType
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
                if(!patientUuid) {
                    var patientData = getPatientById(patientId);
                    SimulationService.getPatientByIdentifier(patientId).then(function(response){
                        var results = response.results;
                        if(results.length == 0){
                            //First register the patient
                            logRegisterPatient(patientData);
                            var patient = $scope.buildPatient(patientData);
                            Patient.save(patient).$promise.then(function (savedPatient) {
                                $scope.idPatientUuidMap[patientId] = savedPatient.uuid;
                                createEvent();
                            });
                        }else if(results.length > 1){
                            var errorMsg = "Found multiple patients with the identifier: "+patientId;
                            logError(errorMsg);
                            throw Error(errorMsg);
                        }else {
                            $scope.idPatientUuidMap[patientId] = results[0].uuid;
                            createEvent();
                        }
                    });
                }else{
                    createEvent();
                }
            }

            function createEvent(){
                logEvent();
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                var patientUuid = $scope.idPatientUuidMap[eventData.identifier];

                if (eventData.event == "death"){
                    var person =  {
                        uuid: patientUuid,
                        dead: true,
                        deathDate: getFormattedDate(eventData.date),
                        causeOfDeath: '125574AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
                    }
                    Person.save(person).$promise.then(function(){
                        $scope.nextEventIndex++;
                        if ($scope.nextEventIndex == $scope.eventCount) {
                            finalizeRunEvents();
                        }else{
                            processNextEvent();
                        }
                    });
                } else {
                    var obs = buildObs(eventData, $scope.idPatientUuidMap[eventData.identifier]);
                    Obs.save(obs).$promise.then(function () {
                        $scope.nextEventIndex++;
                        if ($scope.nextEventIndex == $scope.eventCount) {
                            finalizeRunEvents();
                        }else{
                            processNextEvent();
                        }
                    });
                }
            }

            function getFormattedDate(dateStr){
                return $scope.formatDate(convertToDate(dateStr), 'yyyy-MM-dd');
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

                throw Error("Unknown concept for event "+$scope.displayEvent(eventData));;
            }

            function logMessage(msg){
                var ele = document.querySelector('#console');
                angular.element(ele).append('> '+msg+'<br>');
            }

            function logError(errorMsg){
                var ele = document.querySelector('#console');
                angular.element(ele).append('> <span class="error-msg">'+errorMsg+'</span><br>');
            }

            function resetLogs(){
                var ele = document.querySelector('#console');
                angular.element(ele).html('');
            }

            function logEvent(){
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                logMessage($scope.displayEvent(eventData));
            }

            function finalizeRunEvents(){
                $scope.nextEventIndex = 0;
                //Reset for the user to be able to rerun
                logMessage('');
                logMessage('Events run successfully!');
            }

            function logRegisterPatient(patient){
                var name = patient.givenName+" "+patient.middleName+" "+patient.familyName;
                logMessage("Registering patient: "+name);
            }

        }

    ]);
