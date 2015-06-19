angular.module('App').service('TestBlockService', function($resource) {

    return $resource('test_blocks', {'id': '@id'}, {
        update: {url: 'test_blocks/:id', method: 'PUT', isArray: false},
        remove: {url: 'test_blocks/:id', method: 'DELETE', idArray: false}
    });
});