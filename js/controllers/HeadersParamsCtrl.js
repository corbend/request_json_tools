(function() {

    var Ctrl = function Ctrl($scope, $rootScope) {

        $scope.headersType = [
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
    }

    Ctrl.$inject = ['$scope', '$rootScope'];

    angular.module('App').controller('headersParamsCtrl', Ctrl);

})()
