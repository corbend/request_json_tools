window.ProjectAZ = window.ProjectAZ || {};

(function(module) {"use strict";

    var TestModel = function Test(id_, name, expression, request) {
            
        var t = Object.create(null);
        t._id = id_;
        t.name = name;
        t.selected = false;
        t.expression = expression;
        t.entityService = null;

        var association = request;

        t.run = function($scope, SendRequestService) {
            association.includeParamsToRequest = true;
            association.funcParams = [];
            association.iterParams = [];
            var requestToSend = angular.copy(association);

            delete requestToSend['data'];
            delete requestToSend['lastRecord'];
            delete requestToSend['lastError'];

            console.log("HEADERS PARAMS=" + $scope.params);
            return SendRequestService.sendRequest($scope, requestToSend, false)
                .then(function(result) {
                    result.forEach(function(r) {
                        var da = JSON.parse(r.data);
                        $scope.processRequestResult(t, da);
                    })
                });
        }

        t.addRequestAssociation = function(request) {
            //добавляем ассоциацию с запросом
            //под ассоциацией подразумевается запрос для тестирования api точки
            association = request;

            this.getEntityService().update({id: this._id}, {request: request})
                .$promise.then(function() {
                    alert("Ассоциация успешно добавлена");
                })
        }

        t.hasAssociation = function() {
            return !!association;
        }

        t.removeRequestAssociation = function(request) {
            association = null;
        }

        t.setEntityService = function(service) {
            this.entityService = service;
        }

        t.getEntityService = function() {
            return this.entityService;
        }

        t.isSelected = function() {
            return this.selected;
        }

        Object.defineProperties(t, {
            name: {
                writable: false
            },
            expression: {
                writable: false
            },
            selected: {
                enumerable: false
            },
            association: {
                writable: false,
                enumerable: false
            },
            run: {
                enumerable: false,
                writable: false
            }
        })

        return t;
    }

    var TestBlockModel = function TestBlock(id_, name, tests) {

        var t = Object.create(null);
        t.tests = tests;

        t.runAll = function(timeout) {
            this.tests.forEach(function(test) {

                var testPromise = test.run().$promise;
                $timeout(function() {
                    if (!testPromise.isResolved()) {
                        test.fail = {
                            error: "timeout"
                        };
                    };
                });
            }, this)
        }

        Object.defineProperty(t, 'tests', {
            writable: false,
            enumerable: false
        });

        return t;
    }

    module.Tests = {
        Models: {
            Test: TestModel,
            TestBlock: TestBlockModel
        }
    }

    var Ctrl = function Ctrl(
        $timeout, $log, $scope, $rootScope, $sce,
        WEBSocket, $state, $stateParams, SendRequestService,
        TestEntityService, TestBlockService, ExpressionParser) {

        $scope.params = [];
        $scope.journal = [];
        $scope.tests = [];
        $scope.test_blocks = [];
        $scope.associationFormIsShow = false;
        $scope.targetTest = null;

        $scope.showAssociationForm = function(test) {
            $scope.targetTest = test;
            $scope.associationFormIsShow = true;
        }

        $scope.createTest = function() {
            $scope.$broadcast('create:test');
        }

        $scope.createTestBlock = function() {
            $scope.$broadcast('create:test:block');
        }

        $scope.removeTest = function(test) {
            TestBlockService.remove({id: test._id})
            .$promise.then(function() {
                $log.debug("test removed");
            })
        }

        $scope.addToBlock = function(test, block) {
            TestEntityService.update({"id": test._id}, angular.extend(test, {block: block._id}))
            .$promise.then(function() {
                $log.debug("test add to block");
            })
        }

        $scope.removeFromBlock = function(block) {
            TestBlockService.remove({id: block._id})
            .$promise.then(function() {
                $log.debug("test removed from block");
            })
        }

        var reservedKeywords = ['all of', 'any of', 'length of', 'first of', 'last of'];

        $scope.testVerbs = [
            {argsNum: 1, name: 'is empty',              op: function(a) { return _.isEmpty(a);}},
            {argsNum: 1, name: 'is not empty',          op: function(a) { return !_.isEmpty(a);}},
            {argsNum: 2, name: 'equals',                op: function(a, b) { return a === b; }},
            {argsNum: 2, name: 'does not equal',        op: function(a, b) { return a !== b; }},
            {argsNum: 2, name: 'contains',              op: function(a, b) {
                var re = new RegExp(b);
                return re.test(a);
            }},
            {argsNum: 2, name: 'does not contain',      op: function(a, b) {
                var re = new RegExp(b);
                return !re.test(a);
            }},
            {argsNum: 2, argsNum: 1, name: 'has key',   op: function(a, b) {
                return typeof a[b] != "undefined";
            }},
            {argsNum: 3, name: 'has value',             op: function(a, b, c) {
                return a[b] === c; 
            }},
            {argsNum: 1, name: 'is null',               op: function(a) { return _.isNull(a);}},
            {argsNum: 1, name: 'is a number',           op: function(a) { return _.isNumber(a);}},
            {argsNum: 2, name: 'less than',             op: function(a, b) { return a < b; }},
            {argsNum: 2, name: 'less than or equal',    op: function(a, b) { return a <= b; }},
            {argsNum: 2, name: 'greater than',          op: function(a, b) { return a > b; }},
            {argsNum: 2, name: 'greater than or equal', op: function(a, b) { return a >= b; }}
        ]

        $scope.hasTestsPassed = false;
        $scope.hasTestsFailed = false;

        $scope.testAlertFailed = function() {
            $scope.hasTestsFailed = true;
            $scope.testsFailed = [{status: 0}];
        }

        $scope.testAlertPassed = function() {
            $scope.hasTestsPassed = true;
            $scope.testsPassed = [{status: 1}];
        }

        $scope.getNotificationsList = function() {
            //список оповещений при прохождении тестов
        }

        $scope.runSelectedTests = function() {
            $scope.tests.filter(function(t) {
                return t.isSelected();
            })
            $scope.tests.forEach(function(t) {
                t.run();
            })
        }

        $scope.runTest = function(test) {
            test.run($scope, SendRequestService);
        }

        $scope.loadTests = function() {
            TestEntityService.query().$promise.then(function(data) {
                data.forEach(function(d) {
                    var m = new TestModel(d._id, d.name, d.expression, d.request);
                    m.setEntityService(TestEntityService);
                    $scope.tests.push(m);
                    console.log($scope.tests);
                })
            }).catch(function(err) {
                alert(err);
            })
        }

        $scope.loadTestBlocks = function() {
            TestBlockService.query().$promise.then(function(data) {
                data.forEach(function(d) {
                    var m = new TestBlockModel(d._id, d.name, []);
                    m.setEntityService(TestBlockService);
                    $scope.tests_blocks.push(m);
                })
            }).catch(function(err) {
                alert(err);
            })
        }

        $scope.parseExpression = function(expression) {

            var tokenReplaceSymbol = "#";
            var lexicalStructure = {};

            if (expression.indexOf(tokenReplaceSymbol) != -1) {
                throw new Error("# symbol is reserved for internal use and must not be used in expression");
            }

            //вначале парсим модификаторы
            reservedKeywords.forEach(function(modifierKeyword) {
                if (new RegExp(modifierKeyword).test(expression)) {
                    ExpressionParser.parse(modifierKeyword, expression);
                })
            })  

        }

        $scope.processRequestResult = function(test, data) {

            var KEY_INDEX = 1;
            debugger;
            var expression = test.expression;
            var keywords = expression.split(" ");
            var key = keywords[0];
            var verbNames = $scope.testVerbs.map(function(v) {return v.name});
            var targetVerb = '';

            for (var i = 0; i < verbNames.length; i++) {

                var name = verbNames[i];

                if (new RegExp(name).test(name)) {

                    var sps = expression.split(name);

                    var conditionTest = sps[1];
                    var checkValue = sps[2];
                    var testVerbIndex = verbNames.indexOf(conditionTest);

                    if (testVerbIndex != -1) {
                        targetVerb = $scope.testVebs[testVerbIndex];
                        targetVerb.op(data[key], checkValue);
                    }
                }
            }
        }

        $scope.loadTests();
        $scope.loadTestBlocks();

        $rootScope.$on('create:association', function($event, request) {
            $scope.targetTest;
            $scope.targetTest.addRequestAssociation(request);
        })

    }

    Ctrl.$inject = ['$timeout', '$log', '$scope', '$rootScope', '$sce', 'WEBSocket', '$state', 
                    '$stateParams', 'SendRequestService', 'TestEntityService', 'TestBlockService', 
                    'ExpressionParser'];

    angular.module('App').controller('ApiTestsCtrl', Ctrl);

})(window.ProjectAZ)

