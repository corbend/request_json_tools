var app = angular.module('App', ['ui.router', 'ngResource', 'ui.select']);

app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/requests');

    $stateProvider.state('requests', {
        url: '/requests',
        templateUrl: 'partials/requestList.jade'
    }).state('new', {
        url: '/new',
        templateUrl: 'partials/newRequest.jade'
        // views: {
        //     "newForm@requests": {
        //         url: '/new',
        //         templateUrl: 'partials/newRequest.jade'
        //     }
        // }
    }).state('edit', {
        url: '/edit/:requestId',
        templateUrl: 'partials/newRequest.jade'
    }).state('requestTemplates', {
        url: '/templates',
        templateUrl: 'partials/requestsTemplatesList.jade'
    }).state('createGenerator', {
        url: '/generator/:id/new',
        templateUrl: 'partials/newRequestTemplate.jade'
    }).state('apiTests', {
        views: {
            "@": {
                url: '/apitests',
                templateUrl: 'partials/apiTests.jade'
            },
            "association@apiTests": {
                url: '/apitests/new_assoc',
                templateUrl: 'partials/newRequestAssociation.jade'        
            }
        }
    })
    .state('jsonTools', {
        url: '/json_tools'
    }).state('notifications', {
        url: '/notifications'
    }).state('integration', {
        url: '/integration'
    })
})

app.constant('WEBSocket', function() {
    return io();
})