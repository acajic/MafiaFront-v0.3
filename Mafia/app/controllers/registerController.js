app.controller('RegisterController', function ($scope, $location, $timeout, usersService) {
    "use strict";

    var newUser = {
        username: '',
        email: '',
        password: '',
        repeat_password: ''
    };

    var back = function() {
        $location.path('');
    };



    var registerUser = function() {
        var newUser = $scope.newUser;
        if (newUser.username.length == 0) {
            $scope.registerInfos.push({type: 'danger', msg: 'Username must not be empty'});
        }
        if (newUser.password.length == 0) {
            $scope.registerInfos.push({type: 'danger', msg: 'Password must not be empty'});
            return;
        }
        if (newUser.repeat_password != newUser.password) {
            $scope.registerInfos.push({type: 'danger', msg: 'Repeated password don\'t match the original one.'});
            return;
        }

        var createUserPromise = usersService.createUser(newUser);
        $scope.isLoading = true;
        createUserPromise.then(function(createdUser) {
            $timeout(function() {
                $scope.registerInfos.push({type : 'success', msg: 'Successfully created user ' + createdUser.username + '. Check your email in order to confirm your email address.'});
            });
            $scope.isLoading = false;
        }, function(reason) {
            $scope.isLoading = false;
            for (var key in reason.httpObj.responseJSON) {
                if (reason.httpObj.responseJSON.hasOwnProperty(key))
                    $scope.registerInfos.push({type : 'danger', msg: key + " " + reason.httpObj.responseJSON[key] });
            }
        });
    };

    $scope.closeRegisterInfoAlert = function(index) {
        $scope.registerInfos.splice(index, 1);
    };

    init();

    function init() {
        $scope.newUser = newUser;
        $scope.back = back;
        $scope.registerUser = registerUser;
        $scope.registerInfos = [];
    }

});