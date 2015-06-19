angular.module('App').directive('rcModifier', function() {
    return {
        restricts: '',
        template: '<select ng-model="mod.type" ng-options="modifier for modifier in modifiers"></select><button class="btn btn-success" ng-click="bindModifier()"></button>',
        //require: 'rcInputModify',
        scope: true,//{
            //mods: '@',
            //modifiers: '@'
        //},
        link: function(scope, elm, attrs, rcInputModifyCtrl) {
            scope.myIndex = attrs['index'];
        },
        controller: function($scope) {
            $scope.bindModifier = function() {
                $scope.mods[parseInt($scope.myIndex, 10)].type = $scope.mod.type;
            }
        }
    }
}).directive('rcInputModify', function($interpolate, $compile) {
    return {

        restricts: 'A',
        scope: {
            modifiers: '@',
            mods: '@'
        },
        require: 'ngModel',
        template: '<button class="btn btn-info"></button>',
        link: function(scope, elm, attrs, ngModel) {

            var inputName = attrs['rcInputModify'];
            var v = ngModel.$modelValue;

            if (!v) {
                v = {};
            }

            scope.mods = [];
            scope.modifiers = ['iterator'];

            scope.$watch(function() {
                return scope.mods;
            }, function(newVal, oldVal) {

                var parentModelName = attrs['ngModel'].split(".")[0];
                var parentModel = scope.$parent[parentModelName];

                if (parentModel && !parentModel.modifiers) {
                    parentModel.modifiers = {};
                }

                if (parentModel && newVal != oldVal) {
                    parentModel.modifiers[ngModel.$name] = newVal;
                }
            }, true)

            var stringWithEl = '<rc-modifier index="{{modIndex}}"></rc-modifier>';
            var template = $interpolate(stringWithEl);

            var templateItems = elm.children();
            var button = templateItems.eq(0);
            var buttonTemplate = '<button class="btn btn-info"></button>';
            if (!button.length) {
                button = angular.element(buttonTemplate)
                elm.parent().append(button);
            }

            console.log(elm);
            console.log(button);
            button.bind('click', function() {

                scope.$apply(function() {
                    scope.mods.push({
                        index: scope.mods.length
                    })

                    var inputEl = angular.element(template({modIndex: scope.mods.length - 1}));
                    elm.parent().prepend(inputEl);

                    $compile(inputEl)(scope);
                })
            })
            console.log(elm.parent());
            elm.parent().append(button);
            console.log(elm.parent().children());
            
        },
        controller: function($scope) {
            //
        }
    };
})