var Ctrl = function Ctrl($scope, $rootScope, $state, WEBSocket, TemplateService) {

    var vm = this;

    vm.createGenerator = function(newPack) {
        $state.go('createGenerator', {id: newPack._id});
    }

    // vm.loadRequests = function(selectedTemplate) {
    //     TemplateService.request({id: selectedTemplate._id}).$promise.then(function(requests) {
    //         vm.templateRequests = requests;
    //     })
    // }
}

Ctrl.$inject = ['$scope', '$rootScope', '$state', 'WEBSocket', 'TemplateService'];

angular.module('App').controller('TemplateGeneratorCtrl', Ctrl);