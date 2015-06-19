window.ProjectAZ = window.ProjectAZ || {};

(function(angular, module) {

    var ctrl = function($log, $q, $scope, TestEntityService) {
        
        $scope.test = {};
        $scope.open = false;

        $scope.$on('create:test', function() {
            console.log("PRE CREATE TEST");
            $scope.open = true;
        })

        $scope.ok = function(cb) {    
            $log.debug("confirm modal");

            var test = new TestEntityService($scope.test);

            return test.$save(function(result) {
                $log.debug("new test added");
                var newRequest = new module.Tests.Models.Test(result._id, result.name, result.expression);
                $scope.tests.unshift(newRequest);
                $scope.open = false;
                cb();
            }, function(e) {
                $log.error(e);
            })
        }

        $scope.cancel = function() {
            $log.debug("close modal");
            $scope.open = false;

            return $q(function(resolve, reject) {
                resolve(true);
            })
        }
    }

    ctrl.$inject = ['$log', '$q', '$scope', 'TestEntityService'];

    angular.module('App').controller('createTestCtrl', ctrl);


})(angular, window.ProjectAZ);