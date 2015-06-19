(function() {
    //общий формат языковых конструкций для описания теста
    //([Key Getter:?] [Key Name/Modifier:?]) [Verb] [Value] &&,||
    //Key Getter - ключевое слово для исключения/включения ключей массива (опционально)
    //    если не задано, то тестирование будет выполнено для всех элементов массива результатов
    //Key Name/Modifier - название конкретного ключа из объекта/массива или регулярное выражение для поиска
    //    если не задано, то тестирование будет выполнено для всех элементов массива и ключей объектов
    //    может записано в формате key1:key2:key3:... в данном случае символом : определяется иерархичность структуры
    //Verb - тестовый предикат для значения ключа
    //Value - значение для тестирования

    //аггрегационные формулы для значений
    var aggregatorsv = [];

    var testVerbs = [
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

    function JsonUtils = {
        getKeyRecur: function(obj, searchString) {
            var keys = searchString.split(":");
            var res = obj;
            keys.forEach(function(key) {
                res = res[key];
            })

            return res;
        }
    }

    function Lexeme(literal) {
        this.literal = literal;
        this.functional = false;
        this.unary = false;
        this.resultIterative = false;
    }

    Lexeme.prototype.apply = function() {}

    Lexeme.prototype.isFunction = function() {
        return this.functional;
    }

    Lexeme.prototype.isUnary = function() {
        return this.unary;
    }


    var KeyGetterLexeme = function(literal) {
        this.optional = true;
        this.priority = 0;

        var testOne = function(predicate, obj) {

            var res = [];
            for (var key in obj) {
                if (data.hasOwnProperty(key)) {
                    res.push(predicate(key, obj[key]));
                }
            }

            return res;
        }

        this.choices = [{
            name: 'all of', //должно выполняться условие по всем ключам
            notApplicableVerbs: [],
            op: function(data, predicate) {
                var allpass = true;
                var partialPredicate = lodash.partial(testOne, predicate);

                if (data instanceof Array) {
                    var res = data.map(partialPredicate).map(function(arr) {
                        return arr.reduce(function(val, pre) { return pre && val; }, true);
                    });
                    allpass = res.filter(function(v) {return v;}).length == res.length;
                } else if (typeof data == "object") {
                    allpass = partialPredicate(data).reduce(function(val, pre) { return pre && val; }, true);
                }

                return allpass;
            }
        }, {
            name: 'any of',
            notApplicableVerbs: [],
            op: function(data, predicate) {
                var anypass = true;
                var partialPredicate = lodash.partial(testOne, predicate);

                if (data instanceof Array) {
                    var res = data.map(testOne).map(function(arr) {
                        return arr.reduce(function(val, pre) { return pre || val; }, false);
                    });
                    allpass = res.filter(function(v) {return v;}).length > 0;
                } else if (typeof data == "object") {
                    allpass = testOne(data).reduce(function(val, pre) { return pre || val; }, false);
                }
            }
        }, {
            name: 'length of',
            notApplicableVerbs: ['is empty', 'is not empty', 'contains', 'does not contain', 'has value', 'is null', 'is a number']
            op: function(data, predicate) {
                return predicate(data.length || Object.keys(data).length);
            }
        }, {
            name: 'first of',
            notApplicableVerbs: [],
            op: function(data, predicate) {
                if (data instanceof Array) {
                    var res = data.map(testOne).map(function(arr) {
                        return arr[0];
                    });
                    allpass = res.filter(function(v) {return v;}).length == res.length;
                } else if (typeof data == "object") {
                    allpass = testOne(data)[0];
                }

                return allpass;
            }
        }, {
            name: 'last of',
            notApplicableVerbs: [],
            op: function(data, predicate) {
                if (data instanceof Array) {
                    var res = data.map(testOne).map(function(arr) {
                        return arr[arr.length - 1];
                    });
                    allpass = res.filter(function(v) {return v;}).length == res.length;
                } else if (typeof data == "object") {
                    var seqiantialRes = testOne(data);
                    allpass = seqiantialRes[nth];
                }

                return allpass;
            }
        }, {
            name: 'nth of',
            notApplicableVerbs: [],
            op: function(data, predicate, nth) {
                if (data instanceof Array) {
                    var res = data.map(testOne).map(function(arr) {
                        return arr[nth];
                    });
                    allpass = res.filter(function(v) {return v;}).length == res.length;
                } else if (typeof data == "object") {
                    allpass = testOne(data)[nth];
                }

                return allpass;
            }
        }];

        this.apply = function(literal) {

            var pass = false;

            this.choices.forEach(function(c) {
                pass = new RegExp(c.name).test(literal);
            })

            return pass;
        }

        this.operate = function(operands) {

        }
    }
    

    KeyGetterLexeme.prototype = Object.create(Lexeme);

    var KeyNameModifier = function(literal) {

        this.optional = true;
        this.functional = true;
        this.priority = 1;
        this.literal = literal;

        this.isFunction = function() {
            //может быть функцией, а может быть простым именем поля
            return (literal.startsWith("(") && literal.endsWith(")"));
        }

        this.apply = function(token) {
            return true;
        }

        this.operate = function(data) {
            return JsonUtils.getKeyRecur(data, this.literal);
        }
    }


    KeyNameModifier.prototype = Object.create(Lexeme);

    var TestVerbLexeme = function(literal) {

        this.optional = false;
        this.literal = literal;
        this.verb = null;
        this.priority = 2;

        this.isUnary = function() {
            return this.verb.argsNum == 1;
        }

        this.apply = function() {
            testVerbs.forEach(function(testVerb) {
                if (new RegExp(testVerb.name).test(literal)) {
                    this.verb = testVerb;
                }
            }, this)
        }

        this.operate = function() {
            if (!this.verb) {
                throw new Exception("unrecognized verb");
            }   

            this.verb.op.apply(this, arguments);
        }
    }


    TestVerbLexeme.prototype = Object.create(Lexeme);

    var ValueLexeme = function(literal) {

        this.literal = literal;
        this.optional = false;
        this.priority = 2;
        this.functional = false;

        this.isNumber = function() {
            return !isNaN(parseInt(this.literal));
        }

        this.evaluate = function() {
            return this.isNumber() ? parseInt(this.literal) : this.literal;
        }
    }

    ValueLexeme.prototype = Object.create(Lexeme);

    var Expression = function(compiledLexem) {
        //объект, возвращаемый после компиляции лексем
        this.lexem = compiledLexem;

        this.process = function(nextExpression) {
            var res;
            if (this.lexem.isIterative) {
                res = this.lexem.operate().forEach(nextExpression.lexem.operate);
            } else {
                res = this.lexem.operate(nextExpression.lexem.operate);
            }

            return res;
        }
    }

    var lexemeParseSequence = [KeyGetterLexeme, KeyNameModifier, TestVerbLexeme, ValueLexeme];

    function Parser(parseSequence, splitSymbol) {

        this.splitSymbol = splitSymbol || " ";
        this.parseSequence = parseSequence;
        this.stages = ['parse', 'compile'];
        this.currentState = 0;
        this.functionStack = [];
        this.outputStack = [];

        var syntaxError = new Error("syntax error");
        var errorsDetected = {};

        this.tokenize = function(expression) {
            return expression.split(splitSymbol);
        }

        this.parseExpression = function(expression) {

            var tokens = this.tokenize(expression);
            var parsedLexems = [];
            var error = false;

            //этап парсинга лексем
            this.parseSequence.forEach(function(LexemClass) {

                for (var t = 0; t < tokens.length; t++) {

                    var token = tokens[t];
                    var lexem = new LexemClass();

                    if (!lexem.apply(token) && !lexem.optional) {
                        errorsDetected[lexem.getErrorType()] = lexem.getError();
                        error = true;
                        break;
                    }

                    parsedLexems.push(lexem);

                }

            })

            //этап сборки выражений
            if (!error) {

                this.currentState++;
                parsedLexems.forEach(function(lexem) {
                    if (lexem.isFunction()) {
                        this.functionStack.push(lexem);
                    } else {
                        this.outputStack.push(lexem);
                    }
                })

            } else {
                console.log("SYNTAX ERROR =", errorsDetected);
            }
        }

        this.apply = function() {

            var res = false;
            var isFuncStackEmpty = false;
            var isValueStackEmpty = false;

            while(isFuncStackEmpty) {

                var lastFuncLexem = this.functionStack.pop();
                isFuncStackEmpty = this.functionStack.length == 0;
                var operands = [];

                if (lastFunc.isUnary()) {
                    var value = this.outputStack.pop();
                    operands.push(value);
                } else {
                    var value1 = this.outputStack.pop();
                    var value2 = this.outputStack.pop();
                    operands.push(value1);
                    operands.push(value2);
                }

                res = lastFuncLexem.operate.call(null, operands)
                this.outputStack.push(res);
            }

            return res;
        }
    }

    return angular.module('App').service('ExpressionParser', function() {
        return {
            parse: function(data, expression) {

                debugger;

                var parser = new Parser([KeyGetterLexeme, KeyNameModifier, TestVerbLexeme, ValueLexeme]);

                parser.parseExpression(data, expression);
                var result = parser.apply();

                return result;
                // var expression = test.expression;
                // var keywords = expression.split(" ");
                // var key = keywords[0];
                // var verbNames = $scope.testVerbs.map(function(v) {return v.name});
                // var targetVerb = '';

                // for (var i = 0; i < verbNames.length; i++) {

                //     var name = verbNames[i];

                //     if (new RegExp(name).test(name)) {

                //         var sps = expression.split(name);

                //         var conditionTest = sps[1];
                //         var checkValue = sps[2];
                //         var testVerbIndex = verbNames.indexOf(conditionTest);

                //         if (testVerbIndex != -1) {
                //             targetVerb = $scope.testVebs[testVerbIndex];
                //             targetVerb.op(data[key], checkValue);
                //         }
                //     }
                // }

            }

        }
    });
})()