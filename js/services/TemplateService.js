angular.module('App').service('TemplateService', function($resource) {

    return $resource('templates', {'id': '@id'}, {
        requests: {url: 'templates/:id/requests', method: 'GET', isArray: true},
        update: {url: 'templates/:id', method: 'PUT', isArray: false},
        remove: {url: 'templates/:id', method: 'DELETE', idArray: false}
    });
});