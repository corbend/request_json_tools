var Ctrl = function Ctrl($scope, $rootScope, $sce, $state, WEBSocket, TemplateService) {

    var vm = this;

    vm.loadAllTemplates = function() {
        TemplateService.query().$promise.then(function(data) {
            vm.templates = data;

            vm.templates.forEach(function(template, index) {
                vm.templates[index].name = $sce.trustAsHtml(template.name);
            })
        })
    }

    vm.loadSelectedTemplate = function(selectedTemplate) {
        TemplateService.requests({id: selectedTemplate._id}).$promise.then(function(data) {
            vm.requestsForTemplate = data;
            $scope.requests = vm.requestsForTemplate;
        })
    }

    vm.editNewTemplate = function(editedTemplate) {
        var templateEntity;

        if (editedTemplate) {
            var edited = new TemplateService(editedTemplate);
            
            template.update(function(createdTemplate) {
                vm.templates.push(createdTemplate);
            })
        }
        
    }

    vm.createGenerator = function(newPack) {
        $state.go('createGenerator', {id: newPack._id});
    }

    vm.createNewTemplate = function(newTemplate) {
        var templateEntity;

        templateEntity = new TemplateService(newTemplate);

        templateEntity.$save(function(createdTemplate) {
            vm.templates.push(createdTemplate);
        })
    }

    vm.removeSelectedTemplate = function(selectedTemplate) {
        TemplateService.remove({id: selectedTemplate._id}).$promise.then(function(data) {
            //TODO - отображать сообщения
            vm.templates.forEach(function(template, index) {
                if (template._id == selectedTemplate._id) {
                    vm.templates.splice(index, 1);
                    vm.selectedTemplate = null;
                }
            })
        })
    }

    vm.loadAllTemplates();
}

Ctrl.$inject = ['$scope', '$rootScope', '$sce', '$state', 'WEBSocket', 'TemplateService'];

angular.module('App').controller('TemplateLoaderCtrl', Ctrl);