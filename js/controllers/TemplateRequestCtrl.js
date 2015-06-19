ar Ctrl = function Ctrl($scope, $rootScope, WEBSocket, MakeTemplateService) {

    var vm = this;
    vm.requests = [];

    
}

Ctrl.$inject = ['$scope', '$rootScope', 'WEBSocket', 'MakeTemplateService'];

angular.module('App').controller('TemplateRequestCtrl', Ctrl);