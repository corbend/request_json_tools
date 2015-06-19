(function(angular) {

    var ctrl = function($log, $q, $scope, TestBlockService) {

        $scope.test_block = {};
        $scope.open = false;

        $scope.$on('create:test:block', function() {
            console.log("PRE CREATE TEST BLOCK");
            $scope.open = true;
        });

        $scope.ok = function(cb) {
            $log.debug("confirm modal");
            
            var testBlock = new TestBlockService($scope.test_block);

            return testBlock.$save(function(result) {
                $log.debug("test block added");
                $scope.test_blocks.unshift(new module.Tests.Models.TestBlock(result._id, result.name));
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

    angular.module('App').controller('createTestBlockCtrl', ctrl);
    ctrl.$inject = ['$log', '$q', '$scope', 'TestBlockService'];

})(angular);