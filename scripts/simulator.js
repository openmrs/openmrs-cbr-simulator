/*
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */

var authInterceptorId = 'http-auth-error-interceptor';

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
        "systemSettingService",
        "personService",
        "patientService",
        "obsService"
    ])

    .factory(authInterceptorId, function($q, $rootScope) {
        return {
            responseError: function(response) {
                if (response.status == -1) {
                    Console.warn("Can't reach the server at "+response.config.url);
                }else if (response.status == 401 || response.status == 403) {
                    Console.warn("Invalid authentication credentials, please make sure " +
                        "the passwords for all defined OpenMRS instances are correct and " +
                        "the accounts have the necessary privileges");
                }
                return $q.reject(response);
            }
        }
    }).

    config(function($httpProvider) {
        $httpProvider.interceptors.push(authInterceptorId);
    })

    .controller("SimulatorController", [
        "$scope",
        "$filter",
        "SystemSettingService",
        "PersonService",
        "PatientService", 
        "ObsService",

        function($scope, $filter, SystemSettingService, PersonService, PatientService, ObsService){
            $scope.dataset = dataset;
            $scope.showConsole = false;
            $scope.changingPasswords = false;
            $scope.isRunning = false;
            $scope.artStartConceptUuid = '1255AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.startDrugsConceptUuid = '1256AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.reasonArtStoppedConceptUuid = '1252AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.weightChangeConceptUuid = '983AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
            $scope.idServerPatientUuidMap = {};
            $scope.executedEventIndex = -1;
            $scope.nextEventIndex = 0;
            $scope.eventCount = $scope.dataset.timeline.length;
            $scope.servers = config.openmrsInstances;
            $scope.serverIdPasswordMap = {};
            
            for(var i in config.openmrsInstances) {
                $scope.serverIdPasswordMap[config.openmrsInstances[i].id] = null;
            }

            $scope.dataset.timeline = _.sortBy($scope.dataset.timeline, 'date');

            $scope.run = function(){
                $scope.isRunning = true;
                $scope.showConsole = true;
                runTimeline(true);
            }

            $scope.canRun = function(){
                return !$scope.isRunning;
            }

            $scope.setCredentials = function(){
                if($scope.changingPasswords){
                    $scope.changePasswords();
                }
                
                var credentialsMap = {};
                for(var i in config.openmrsInstances){
                    var server = config.openmrsInstances[i];
                    var password = $scope.serverIdPasswordMap[server.id];
                    credentialsMap[server.id] = btoa(server.username+":"+password);
                }

                Util.setCredentials(credentialsMap);
            }

            $scope.showPasswordsForm = function(){
                return Util.getCredentials() == null || $scope.changingPasswords;
            }

            $scope.changePasswords = function(){
                $scope.changingPasswords = false;
                $scope.setCredentials();
            }

            $scope.displayEvent = function(event) {
                var patient = getPatientById(event.identifier);
                var date = $scope.formatDate(convertToDate(event.date), 'dd-MMM-yyyy');
                return Util.getEventLabelPrefix(event) + " " + Util.getPatientDisplay(patient) + " on " + date;
            }

            function runTimeline(resetConsole){
                if(resetConsole){
                    Console.clear();
                }
                
                Console.info('Processing events...');
                Console.info('');
                processNextEvent();
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
                    identifierType: server.patientIdentifierTypeUuid
                }

                return {
                    person: person,
                    identifiers: [identifier]
                }

            }

            function processNextEvent(){
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                var patientId = eventData.identifier;
                var server = getServer();
                var patientUuid = $scope.idServerPatientUuidMap[patientId+":"+server.id];
                if(!patientUuid) {
                    var patientData = getPatientById(patientId);
                    PatientService.getPatientByIdentifier(server, patientId).then(
                        function(response){
                            var results = response.results;
                            if(results.length == 0){
                                //First register the patient
                                registerPatient(patientData, patientId, server, eventData);
                            }else if(results.length > 1){
                                var errMsg = "Found multiple patients with the identifier: "+patientId+" at "+getServerDisplay(server);
                                handlePostEventAction(false, server, errMsg);
                            }else {
                                $scope.idServerPatientUuidMap[patientId+":"+server.id] = results[0].uuid;
                                createEvent(server);
                            }
                        },
                        function(){
                            var errMsg = "An error occurred while looking up the patient with id: "+patientId+" at "+getServerDisplay(server);
                            handlePostEventAction(false, server, errMsg);
                        }
                    );
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

            function registerPatient(patientData, identifier, server, eventData){
                Util.logRegisterPatient(patientData, server);
                var patient = $scope.buildPatient(patientData, server);
                PatientService.savePatient(server, patient).then(
                    function (savedPatient) {
                        $scope.idServerPatientUuidMap[identifier+":"+server.id] = savedPatient.uuid;
                        createEvent(server);
                    },
                    function(){
                        var errMsg = "An error occurred while registering patient with "+Util.getPatientDisplay(patientData);
                        handlePostEventAction(false, server, errMsg);
                    }
                );
            }

            function createEvent(server){
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                var patientUuid = $scope.idServerPatientUuidMap[eventData.identifier+":"+server.id];

                if (eventData.event == "deathdate"){
                    var person =  {
                        uuid: patientUuid,
                        dead: true,
                        deathDate: getFormattedDate(eventData.date),
                        causeOfDeath: '125574AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
                    }
                    PersonService.savePerson(server, person).then(
                        function(){
                            handlePostEventAction(true, server);
                        },
                        function(){
                            var errMsg = "An error occurred processing: "+$scope.displayEvent(eventData);
                            handlePostEventAction(false, server, errMsg);
                        }
                    );
                } else {
                    var obs = buildObs(eventData, $scope.idServerPatientUuidMap[eventData.identifier+":"+server.id]);
                    ObsService.saveObs(server, obs).then(
                        function () {
                            handlePostEventAction(true, server);
                        } ,
                        function(){
                            var errMsg = "An error occurred processing: "+$scope.displayEvent(eventData);
                            handlePostEventAction(false, server, errMsg);
                        }
                    );
                }
            }

            function getFormattedDate(dateStr){
                return $scope.formatDate(convertToDate(dateStr), 'yyyy-MM-dd');
            }

            function handlePostEventAction(wasSuccessful, server, errorMsg){
                if(wasSuccessful){
                    logEvent(server);
                }else {
                    Console.error(errorMsg);
                }

                $scope.nextEventIndex++;
                if (!wasSuccessful || $scope.nextEventIndex == $scope.eventCount) {
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

                Console.error("Unknown concept for event "+$scope.displayEvent(eventData));
                throw Error("Unknown concept for event "+$scope.displayEvent(eventData));
            }

            function logEvent(server){
                var eventData = $scope.dataset.timeline[$scope.nextEventIndex];
                Console.info($scope.displayEvent(eventData)+" at "+server.name);
            }

            function finalizeRunEvents(){
                $scope.isRunning = false;
                $scope.nextEventIndex = 0;
                //Reset for the user to be able to rerun
                Console.info('');
                Console.info('Done!');
            }

        }

    ]);