 (function() {
    "use strict";

    var Ctrl = function Ctrl($scope, $rootScope, $sce, WEBSocket, $state, $stateParams, MakeRequestService) {

        $scope.req = {
            selected: false,
            method: 'GET'
        };

        $scope.methods = [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH'
        ];

        $scope.saveNew = function() {

            var lockedReq = angular.copy($scope.req);
            $rootScope.$broadcast('create:association', lockedReq);
            $scope.associationFormIsShow = false;
        }

        $scope.cancelNew = function() {
            $scope.associationFormIsShow = false;
        }
    }

    Ctrl.$inject = ['$scope', '$rootScope', '$sce', 'WEBSocket', '$state', '$stateParams', 'MakeRequestService'];

    angular.module('App').controller('newRequestAssociationCtrl', Ctrl);
 })()
    