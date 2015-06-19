var Ctrl = function Ctrl($scope, $rootScope) {

    $scope.functionParams = [];
    $scope.unsubsribes = [];

    $scope.addFuncParam = function() {
        var baseParam = {
            jsonParamName: 'paramName',
            funcBody: "function() {};"
        }

        var paramToAdd = angular.copy(baseParam);
        paramToAdd.index = $scope.functionParams.length + 1;

        $scope.functionParams.push(paramToAdd);
    };

    $scope.removeFuncParam = function(param) {
        $scope.functionParams.splice(param.index - 1, 1);
    };

    $scope.unsubsribes.push(
        $scope.$on('load:request', function(event, data) {
            debugger;
            $scope.functionParams = angular.copy(data.request.funcParams);
        })
    )

    $scope.unsubsribes.push(
        $scope.$on('save:request', function(event, data) {
            debugger;
            //$scope.req.funcParams = $scope.functionParams;
            data.request.funcParams = $scope.functionParams;
        })
    )

    // $scope.$on('destroy', function() {
    //     angular.forEach($scope.unsubsribes, function(a) {
    //         a();
    //     })
    // })
}

Ctrl.$inject = ['$scope', '$rootScope'];

angular.module('App').controller('FuncParamCtrl', Ctrl);