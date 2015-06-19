var Ctrl = function Ctrl($scope, $rootScope, WEBSocket, $state, MakeRequestService, encoderService, SendRequestService) {

    $scope.journal = [];
    $scope.templateRequests = [];
    $scope.lastRequest = {};
    $scope.selectedJournalRecord = null;

    $scope.$watch('selectedJournalRecord', function() {
        //TODO - сделать селект на запись журнала
    });

    $scope.isJSON = function(responseContentType) {
        var t = /application\/json/.test(responseContentType);
        //console.log('request response is JSON');
        return t;
    }

    $scope.isHtml = function(responseContentType) {
        var t = /text\/html/.test(responseContentType);
        //console.log('request response is Html');
        return t;
    }

    $scope.lastMessages = [];
    $scope.groups = [];

    MakeRequestService.query().$promise.then(function(requests) {
        $scope.requests = requests;

        $scope.requests.forEach(function(r) {
            if (r.group && $scope.groups.indexOf(r.group) == -1) {
                $scope.groups.push(r.group);
            }
        })
    })

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

    $scope.sendWithIterators = function(request) {

        request.iteratorCount = parseInt(request.loadIteratorCount, 10);
        request.iteratorMode = true;

        $scope.sendRequest($scope, request, null, null, true);
    }

    $scope.showIteratorPanel = function(request) {

        request.isIteratorPanelShow = true;
    }

    $scope.hideIteratorPanel = function(request) {

        request.isIteratorPanelShow = false;
        request.iteratorMode = false;
        request.iteratorCount = 0;
        request.loadIteratorCount = 0;
        request.iteratorStartValue = 0;
    }

    $scope.sendRequest = SendRequestService.sendRequest;

    $scope.sendRequest1 = function(request, repeated, lastRecord, first) {

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

            // $scope.$watch(function() {
            //     return request.deactivate;
            // }, function(nV) {
            //     if (nV === true) {
            //         request.activated = false;
            //         var activatedCount = 0;
            //         $scope.requests.forEach(function(r) {
            //             if (r.activated) {
            //                 activatedCount++;
            //                 $scope.isRequestsActive = true;
            //             }
            //         })

            //         if (!activatedCount) {
            //             $scope.isRequestsActivate = false;
            //         }
            //     }
            // })

            // $scope.$watch(function() {
            //     return request.activated;
            // }, function(nV) {
            //     if (nV === true) {
                    request.selected = true;
                    $scope.isRequestsActive = true;
                    // if (!$scope.isRequestsActive) {
                    //     $scope.requests.forEach(function(r) {
                    //         if (r.activated) {
                    //             $scope.isRequestsActive = true;
                    //         }
                    //     })
                    // }
                //}
            // })

            $scope.params.forEach(function(param) {
                if (param.name) {
                    requestHeaders[param.name] = $scope.modifyHeaderValue(param.name, param.value);
                }
            })

            prepareDynamicParams(request);
            prepareIteratorParams(request, first);

            var params = angular.extend({
                headers: requestHeaders,
                template: request.template,
            }, {id: request._id});

            var promise = MakeRequestService.send(params).$promise;

            promise.then(function(responseData) {
                request.lastSend = new Date().toLocaleString();
                request.status = responseData.status;
                request.data = responseData.data;
                request.contentType = responseData.contentType;
                $scope.lastRequest = request;
                if (!repeated) {
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

                if (!repeated) {
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
        }

        request.activated = true;
        
        for (var i = 0; i < batch; i++) {    

            f();

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

    }

    $scope.duplicateRequest = function(request) {
        var a = angular.copy(request);
        delete a._id;
        var newRequest = new MakeRequestService(a);
        newRequest.$save(function(newRequest) {
            $scope.requests.push(newRequest);    
        });
        
    }

    $scope.setRepeat = function(request, timeout) {
        var tm = parseInt((timeout || request.timeout), 10);
        if (!isNaN(tm)) {
            request.timeoutAccept = request.timeout;
        }
    }

    $scope.subscribeToWebSocket = function() {

        WEBSocket().on('message', function(msg) {
            debugger;
            $scope.lastMessage.push(msg);
        })
    }

    $scope.params = [];

    //deprecated - remove to headersParamsCtrl
    $scope.headerParams = [
        'Cookie', 'Content-Type', 'Authorization'
    ]
    $scope.addHeaderParam = function() {
        //добавление параметров запроса
        $scope.params.push({
            name: $scope.predefineHeaderParam || '',
            value: '',
            index: $scope.params.length + 1
        });
    }

    $scope.removeHeaderParam = function(param) {
        $scope.params.splice(param.index - 1, 1);
    }

    $scope.modifyHeaderValue = function(name, value) {
        console.log("SET HEADER=", name, value);
        if (name.toLowerCase() == 'authorization') {
            value = "Basic " + encoderService.encode(value);
            console.log("SET AUTH=", value);
        }
        return value;
    }

    $scope.editRequest = function(request) {
        $state.go('edit', {requestId: request._id});
    }

    $scope.removeRequest = function(request) {
        MakeRequestService.remove({id: request._id}, function() {
            $state.reload('requests');
        })
    }

    $scope.unmuteAndSend = function(request) {
        request.mute = false;

        $scope.$watch(function() {
            return request.mute;
        }, function(nVal, oVal) {
            if (nVal != oVal && nVal === false) {
                console.log("MUTE REQUEST");
            }
        })

        if (!request.loadIteratorCount) {
            $scope.sendRequest($scope, request);
        } else {
            $scope.sendWithIterators(request);
        }
    }

    $scope.massSendRequest = function() {
        $scope.requests.forEach(function(r) {
            
            var pendingActivate = true;

            // $scope.$watch(function() {
            //     return r.activated;
            // }, function() {

            //     if (r.selected && !r.activated && pendingActivate) {
            //         pendingActivate = false;
            //         console.log("REACTIVATE REQUEST");
            //         $scope.unmuteAndSend(r);
            //     }
            // })

            if (r.selected) {
                pendingActivate = false;
                if (!isNaN($scope.massRepeatTime)) {
                    r.timeout = $scope.massRepeatTime;
                    $scope.setRepeat(r);
                }

                $scope.unmuteAndSend(r);
            } else {
                r.deactivate = true;
            }
    
        })
    }

    $scope.massMuteRequest = function() {
        $scope.isRequestsActive = false;
        $scope.requests.forEach(function(r) {
            if (r.selected) {
                r.mute = true;
            }
        })
    }

    $scope.removeSelected = function() {
        $scope.requests.forEach(function(r) {
            if (r.selected) {
                $scope.removeRequest(r);
            }
        })
    }

    $scope.isSelectedSendActive = function() {

        return $scope.isRequestsActive;
    }

    $scope.selectGroup = function(group) {
        $scope.requests.forEach(function(r) {
            if (group == r.group) {
                r.selected = true;
            }
        })
    }

    $scope.unselectAll = function() {
        $scope.requests.forEach(function(r) {
            r.selected = false;
        })
    }

    $scope.clearJournal = function() {
        $scope.journal = [  ];
    }

    $scope.subscribeToWebSocket();
}

Ctrl.$inject = ['$scope', '$rootScope', 'WEBSocket', '$state', 'MakeRequestService', 'EncoderService', 'SendRequestService'];

angular.module('App').controller('RequestListCtrl', Ctrl);