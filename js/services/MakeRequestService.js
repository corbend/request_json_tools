angular.module('App').service('MakeRequestService', function($resource) {

    return $resource('requests', {'id': '@id'}, {
        send: {url: 'requests/:id/send', method: 'POST', isArray: false},
        sendFake: {url: 'request/send', method: 'POST', isArray: false},
        update: {url: 'requests/:id', method: 'PUT', isArray: false},
        remove: {url: 'requests/:id', method: 'DELETE', idArray: false}
    });
});