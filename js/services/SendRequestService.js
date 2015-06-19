angular.module('App').service('SendRequestService', ['$q', 'EncoderService',
    'MakeRequestService', function($q, EncoderService, MakeRequestService) {

    function traverseJson(param, body) {

        var isIndexed = false;
        var paramName = param.jsonParamName;
        var spl = paramName.split(".");
        var cParamName = paramName;
        var cBody = body;
        var nextBody = body[spl[0]];

        if (typeof nextBody == "undefined") {return {paramName: ''};}

        for (var i = 1; i < spl.length - 1; i++) {
            cParamName = spl[i];
            isIndexed = !isNaN(cParamName);
            if (isIndexed) {
                nextBody = nextBody[parseInt(cParamName)];
            } else {
                nextBody = nextBody[cParamName];
            }
            cBody = nextBody;
        }

        return {
            paramName: spl[spl.length - 1],
            body: cBody
        }

    }

    function prepareDynamicParams(request) {
        //для динамически определяемых параметров нужно подготовить их с помощью функций

        var baseParamTemplate = request.template;
        if (!angular.isObject(request.template) && request.template) {
           baseParamTemplate = JSON.parse(request.template);
        }

        request.funcParams.forEach(function(param) {
            var r = traverseJson(param, baseParamTemplate);

            if (r.paramName && r.body) {
                r.body[r.paramName] = eval(param.funcBody);
            }
        })

        //обновляем параметры
        request.template = baseParamTemplate;
    }

    function prepareIteratorParams(request, start) {

        var baseParamTemplate = request.template;
        if (!angular.isObject(request.template) && request.template) {
           baseParamTemplate = JSON.parse(request.template);
        }

        if (request.isIteratorPanelShow) {
            request.iterParams.forEach(function(param) {
                var r = traverseJson(param, baseParamTemplate);

                if (r.paramName && r.body) {

                    if (!request.lastItersValue) {
                        request.lastItersValue = {};
                    }

                    if (start) {
                        request.lastItersValue[param.jsonParamName] = parseInt(request.iteratorStartValue, 10) || 0;
                    }

                    if (param.funcBody.slice(param.funcBody.length - 2, param.funcBody.length) !== "()") {
                        throw "invalid iterator function"
                    }

                    var step = request.loadIteratorCount - request.iteratorCount;

                    var iterValueFunction = param.funcBody.slice(0, param.funcBody.length - 2) 
                        + "(" + step + ", " + request.lastItersValue[param.jsonParamName] + ")";
                    
                    r.body[r.paramName] = eval(iterValueFunction);
                    console.log("GET ITERATOR PARAM=", r.body[r.paramName]);

                    request.lastItersValue[r.paramName] = r.body[r.paramName];
                }
            })

            request.iteratorCount--;

            request.template = baseParamTemplate;
        }
    }

    function modifyHeaderValue(name, value) {
        console.log("SET HEADER=", name, value);
        if (name.toLowerCase() == 'authorization') {
            value = "Basic " + encoderService.encode(value);
            console.log("SET AUTH=", value);
        }
        return value;
    }

    return {
        sendRequest: function($scope, request, repeated, lastRecord, first) {

            var batch = request.batchNumber || 1;
        
            if (!request.lastRecord) {
                request.lastRecord = {
                    counter: 0
                }
            }

            var f = function() {

                if (request.mute) {
                    return;
                }

                var requestHeaders = {};

                request.selected = true;

                $scope.isRequestsActive = true;

                if ($scope.params) {
                    $scope.params.forEach(function(param) {

                        if (param.name) {
                            requestHeaders[param.name] = modifyHeaderValue(param.name, param.value);
                        }
                    })
                }

                prepareDynamicParams(request);
                prepareIteratorParams(request, first);

                var params = angular.extend({
                    headers: requestHeaders,
                    template: request.template,
                }, {id: request._id});

                var promise;

                if (request.includeParamsToRequest) {
                    angular.extend(params, request);
                    promise = MakeRequestService.send(params).$promise;
                } else {
                    promise = MakeRequestService.sendFake(params).$promise;
                }               

                promise.then(function(responseData) {
                    request.lastSend = new Date().toLocaleString();
                    request.status = responseData.status;
                    request.data = responseData.data;
                    request.contentType = responseData.contentType;
                    $scope.lastRequest = request;

                    if (!repeated && $scope.journal) {
                        var journalRecord = angular.copy(request);
                        journalRecord.counter = 1;
                        request.lastRecord = journalRecord;
                        $scope.journal.push(journalRecord);
                        request.lastRecordIndex = $scope.journal.length - 1;
                    } else {
                        $scope.journal[request.lastRecordIndex].counter++;
                    }
                }, function(err) {
                    $scope.lastRequest = {
                        error: err
                    }
                    request.status = err.status;
                    request.lastError = err;

                    if (!repeated && $scope.journal) {
                        var journalRecord = angular.copy(request);
                        journalRecord.counter = 1;
                        journalRecord.lastError = err;
                        request.lastRecord = journalRecord;
                        $scope.journal.push(journalRecord);
                        request.lastRecordIndex = $scope.journal.length - 1;
                    } else {
                        $scope.journal[request.lastRecordIndex].counter++;
                    }
                })

                return promise;
            }

            request.activated = true;
            var promises = [];

            for (var i = 0; i < batch; i++) {    

                promises.push(f());

                if (!request.mute && (request.timeoutAccept || request.iteratorMode)) {

                    if (request.iteratorMode && request.iteratorCount) {
                         console.log("CURRENT ITERATOR->", request.iteratorCount);
                        if (request.iteratorCount <= 0) {
                            console.log("BREAK ITERATOR->");
                            break;
                        }
                    } 
                    
                    setTimeout(function() {
                        console.log("SEND REPEAT->", request);
                        lastRecord = request.lastRecord;

                        $scope.sendRequest($scope, request, true, lastRecord);
                    }, parseInt(request.timeoutAccept, 10));
                }
            }

            return $q.all(promises);
        }
    }
}
]);