angular.module('App').service('TestEntityService', function($resource) {

    return $resource('tests', {'id': '@id'}, {
        update: {url: 'tests/:id', method: 'PUT', isArray: false},
        remove: {url: 'tests/:id', method: 'DELETE', idArray: false}
    });
});