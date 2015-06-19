angular.module('App').directive('RcSelectOne', function() {
    return {
        require: 'RcSelectOne, ngModel',
        scope: true,
        link: function(scope, elm, attrs, ctrls) {

            var dir = ctrls[0],
                ngModel = ctrls[1];

        }
    };
})