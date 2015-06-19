angular.module('App')
    .directive('rcModalConfirm', function($log) {
        return {
            restrict: 'A',
            require: '^rcModalWindow',
            scope: {
                onConfirm: "&rcModalConfirm",
                modalTarget: '@modalTarget'
            },
            link: function(scope, elm, attrs, rcModalWindow) {

                scope.modalWindowCtrl = rcModalWindow;
                scope.modalTarget = elm.parent().parent();

                elm.bind('click', function() {
                    scope.confirm();
                })
            },
            controller: function($scope) {
                $scope.confirm = function() {
                    $log.debug("modal confirm");
                    $scope.onConfirm(function() {
                        $scope.modalTarget.modal('hide');
                    })
                    $scope.$apply();
                }
            }
        }
    })
    .directive('rcModalClose', function($log) {
        return {
            restrict: 'A',
            require: '^rcModalWindow',
            scope: {
                onClose: "&rcModalClose",
                modalTarget: '@modalTarget'
            },
            link: function(scope, elm, attrs, rcModalWindow) {

                scope.modalWindowCtrl = rcModalWindow;
                scope.modalTarget = elm.parent().parent();

                elm.bind('click', function() {
                    scope.dismiss();
                })
            },
            controller: function($scope) {
                $scope.dismiss = function() {
                    $log.debug("modal close");
                    $scope.onClose(function() {
                        $scope.modalTarget.modal('hide');
                    });                   
                    $scope.$apply();
                }
            }
        }
    })
    .directive('rcModalWindow', function() {

        return {
            restrict: 'A',
            require: '^?parent',
            scope: {
                open: "=rcModalWindow"
            },
            link: function(scope, elm, attrs, modalWindowCtrl) {

               scope.modalTarget = elm.parent();
               scope.init = true;
            },
            controller: function($scope) {

                $scope.getModalTarget = function() {
                    return $scope.modalTarget;
                }

                $scope.$watch('open', function(val) {

                    if (!$scope.modalTarget.modal) {
                        throw new Error("you must provide modal admin");
                    }

                    if ($scope.init) {
                        if (val) {
                            $scope.modalTarget.modal({show: true});
                        } else {
                            if ($scope.modalTarget.modal) {
                                $scope.modalTarget.modal('hide');
                            }
                        }
                    }
               })
            }
        };
    }
)