var URL_USERS_ME = 'users/me';
var URL_LOGIN = 'login';

app.factory('authService', function(serverService, $q, citiesService) {
    "use strict";

    var user = {};



    var authenticate = function(username, password) {
        var deferred = $q.defer();

        if (username && password) {
            var userMePromise = serverService.post(URL_LOGIN, {username:username,password:password});

            userMePromise = userMePromise.then(function(userMe) {
                angular.copy(userMe, user);
                serverService.setAuthToken(userMe.auth_token.token_string, userMe.auth_token.expiration_date);
                return user;
            });

            return userMePromise;


        } else {

            if (serverService.getAuthToken()) {
                return this.userMe(false);
            } else {

                // user will have to enter credentials if they want access
                deferred.reject('Method "authService.authenticate": Neither credentials provided nor cookie present.');

            }

            return deferred.promise;
        }
    };

    var impersonationAuthenticate = function(userId) {
        return serverService.get('impersonate_login/'+userId).then(function(impersonatedUser) {
            angular.copy(impersonatedUser, user);
            serverService.setAuthToken(impersonatedUser.auth_token.token_string, impersonatedUser.auth_token.expiration_date);
            return user;
        });;
    };

    var emailConfirmation = {
        code: null
    };

    var exchangeEmailConfirmationCode = function(emailConfirmationCode) {
        var userMePromise = serverService.post('exchange_email_confirmation_code', {email_confirmation_code : emailConfirmationCode});

        userMePromise = userMePromise.then(function(userMe) {
            angular.copy(userMe, user);
            serverService.setAuthToken(userMe.auth_token.token_string, userMe.auth_token.expiration_date);
            return user;
        });

        return userMePromise;
    };


    var userMe = function(refresh) {
        var deferred = $q.defer();

        if (serverService.getAuthToken()) {
            if (refresh || !user.id) {
                var userMePromise = serverService.get(URL_USERS_ME,null);

                userMePromise.then(function(userMe) {
                    angular.copy(userMe, user);
                    deferred.resolve(user);
                }, function(reason) {
                    angular.copy({}, user);
                    deferred.resolve(null);
                });

            } else {
                deferred.resolve(user);
            }
        } else {
            angular.copy({}, user);
            deferred.resolve(null);
        }

        return deferred.promise;
    };

    var notifications = {
        shouldSignOut: false,
        shouldSignIn: false
    };

    var signOut = function() {
        angular.copy({}, user);

        var signOutPromise = serverService.delete("logout");
        serverService.setAuthToken("", null);
        citiesService.deleteAllCachedCities();
        return signOutPromise;
    };



    return {
        user: user,
        authenticate: authenticate,
        impersonationAuthenticate: impersonationAuthenticate,
        emailConfirmation: emailConfirmation,
        exchangeEmailConfirmationCode: exchangeEmailConfirmationCode,
        userMe: userMe,
        notifications: notifications,
        signOut: signOut
    };
});