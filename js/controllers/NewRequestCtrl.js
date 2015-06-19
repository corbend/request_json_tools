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

    $rootScope.$on('copy:request', function(copyRequest) {
        $scope.saveNew();
    })

    $scope.saveNew = function() {

        $rootScope.$broadcast('save:request', {request: $scope.req});

        var newRequest = new MakeRequestService($scope.req);

        if (!$scope.req._id) {
            newRequest.$save(function() {
                $state.go('requests');
            });
        } else {
            newRequest.$update({id: $scope.req._id}, function() {
                $state.go('requests');
            })
        }

    }

    if ($stateParams.requestId) {
        MakeRequestService.get({id: $stateParams.requestId}).$promise.then(function(requestData) {
            $scope.req = requestData;

            $rootScope.$broadcast('load:request', {request: $scope.req});
        })
    }

    $scope.cancelNew = function() {
        $scope.$broadcast('destroy');
        $state.go('requests');
    }
}

Ctrl.$inject = ['$scope', '$rootScope', '$sce', 'WEBSocket', '$state', '$stateParams', 'MakeRequestService'];

angular.module('App').controller('NewRequestCtrl', Ctrl);