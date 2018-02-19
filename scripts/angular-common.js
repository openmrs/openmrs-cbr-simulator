angular.module('simulator.common', [])

    .factory("RestService", function($q) {
        function populateResults(resource, params, deferred, results) {
            resource.query(params).$promise.then(function(res) {
                results = results.concat(res.results);

                var hasMoreResults = false;

                if (res.links) {
                    for (i = 0; i < res.links.length; i++) {
                        if (res.links[i].rel == "next") {
                            var startIndexRe = /startIndex=([0-9]*)/;
                            var startIndex = startIndexRe.exec(res.links[i].uri);
                            params["startIndex"] = startIndex[1];

                            hasMoreResults = true;
                            populateResults(resource, params, deferred, results);

                            break;
                        }
                    }
                }

                if (!hasMoreResults) {
                    deferred.resolve(results);
                }
            }, function(error) {
                deferred.reject(error);
            });
        }

        return {
            getAllResults: function(resource, params) {
                var deferred = $q.defer();
                var results = [];

                populateResults(resource, params, deferred, results);

                return deferred.promise;
            }
        }
    }).

    config(function($httpProvider) {
        $httpProvider.defaults.headers.common['Authorization'] = 'Basic ';
    });