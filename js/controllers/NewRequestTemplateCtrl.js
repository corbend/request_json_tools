var Ctrl = function Ctrl($scope, $rootScope, $sce, $interpolate, WEBSocket, $state, $stateParams, TemplateService, MakeRequestService) {

    $scope.messages = {
        success: {
            doneSave: ''
        },
        error: {
            doneSave: ''
        }
    }

    $scope.newTemplate = {
        _id: $stateParams.id,
        method: 'GET'
    };

    if ($stateParams.id) {
        TemplateService.get({id: $stateParams.id}).$promise.then(function(templateData) {
            angular.extend($scope.newTemplate, templateData);
            $rootScope.$broadcast('load:request', {request: $scope.newTemplate});
        })
    }

    $scope.methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    function applyModifiers(requestIndex, templateData) {

        return function() {
            if (templateData.modifiers) {
                
                Object.keys(templateData.modifiers).forEach(function(modifierInputName) {
                    var modifierList = templateData.modifiers[modifierInputName];
                    var iteratorApplyObject = {};

                    for (var i = 0; i < modifierList.length; i++) {
                        iteratorApplyObject['f' + i] = 0;
                    }

                    modifierList.forEach(function(modifier, idx) {
                        
                        if (modifier.type == "iterator") {
                            iteratorApplyObject['f' + idx] = requestIndex;
                        }

                    })

                    var parsedValue;
                    try {
                        parsedValue = $interpolate(templateData[modifierInputName])(iteratorApplyObject);
                    } catch(e) {
                        throw "parse fieldInput<" + modifierInputName + "> error";
                    }

                    templateData[modifierInputName] = parsedValue;
                    console.log("generatedData=", templateData);
                })
            }
        }
    }

    $scope.saveTemplate = function(editedTemplate) {

        $rootScope.$broadcast('save:request', {request: editedTemplate});

        var service = new TemplateService(editedTemplate);
        service.$update({id: editedTemplate._id}, function() {
            $scope.messages.success.doneSave = 'Update success!';
        }, function() {
            $scope.messages.error.doneSave = 'Error on update!';
        })
    }

    $scope.generateRequests = function() {
        var entity = $scope.newTemplate;
        var count = entity.generateBatchNumber;

        $scope.modelSaved = parseInt(count);
        $scope.modelErrors = new Array(count);
        for (var c = 0; c < count; c++) {
            var templateData = angular.copy(entity);
            $scope.saveNew(templateData, applyModifiers(c, templateData));
        }
    }

    $scope.saveNew = function(modelData, modifierDataFunction) {

        //$rootScope.$broadcast('save:request', modelData);

        if (modelData._id) {
            delete modelData._id;
        }

        if (modifierDataFunction) {
            modifierDataFunction(modelData);
        }

        $rootScope.$broadcast('save:request', {request: modelData});

        var newRequest = new MakeRequestService(modelData);       

        if (!modelData._id) {
            newRequest.$save(function() {
                $scope.modelSaved--;
                if ($scope.modelSaved == 0) {
                    $state.go('requests');
                }
            }, function(err) {
                $scope.modelErrors[$scope.modelSaved] = err;
            });
        } else {
            newRequest.$update({id: modelData._id}, function() {
                
            })
        }

    }

    if ($stateParams.requestId) {
        MakeRequestService.get({id: $stateParams.requestId}).$promise.then(function(requestData) {
            $scope.req = requestData;
            //$rootScope.$broadcast('load:request', $scope.req);
        })
    }

    $scope.quit = function() {
        $state.go('requests');
    }
}

Ctrl.$inject = ['$scope', '$rootScope', '$sce', '$interpolate', 'WEBSocket', '$state', '$stateParams', 'TemplateService', 'MakeRequestService'];

angular.module('App').controller('NewRequestTemplateCtrl', Ctrl);