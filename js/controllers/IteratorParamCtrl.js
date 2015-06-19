var Ctrl = function Ctrl($scope, $rootScope) {

    var pars = $scope.iterParams = [];

    $scope.addIterParam = function() {
        console.log("ADD ITER PARAM");
        var baseParam = {
            jsonParamName: 'paramName',
            funcBody: "function() {};"
        }

        var paramToAdd = angular.copy(baseParam);
        paramToAdd.index = pars.length + 1;

        $scope.iterParams.push(paramToAdd);
    };

    $scope.removeIterParam = function(param) {
        $scope.iterParams.splice(param.index - 1, 1);
    };

    $scope.$on('load:request', function(event, data) {
        $scope.iterParams = angular.copy(data.request.iterParams);
    });

    $scope.$on('save:request', function(event, data) {
        data.request.iterParams = $scope.iterParams;
    })
}

Ctrl.$inject = ['$scope', '$rootScope'];

angular.module('App').controller('IteratorParamCtrl', Ctrl);