app.controller('CityController', function ($scope, $routeParams, $q, $timeout, $location, citiesService, actionResultsService, residentsService, authService, layoutService) {
    "use strict";

    layoutService.setHomeButtonVisible(true);

    $scope.nextMoment = {};


    function initCity(cityId) {
        var tabActive = getCookie(kCitySelectedTabIndexCookieKey);
        if (!tabActive) {
            tabActive = {0: true, 1: false, 2: false};
        }
        $scope.tabActive = tabActive;

        var cityPromise = citiesService.getCity(cityId);

        var userMePromise = authService.userMe();
        // var roleIdPromise = getRoleId(cityId);

        $scope.isLoading = true;
        $q.all([cityPromise, userMePromise]).then(function(result) {


            var city = result[0];

            initCityHasRoles(city);



            var residentsById = {};
            angular.forEach(city.residents, function(someResident) {
                residentsById[someResident.id] = someResident;
            });
            city.residentsById = residentsById;

            var daysById = {};
            angular.forEach(city.days, function(someDay) {
                daysById[someDay.id] = someDay;
            });
            city.daysById = daysById;
            city.current_day = daysById[city.current_day.id];

            var rolesById = {};
            angular.forEach(city.city_has_roles, function(cityHasRole) {
                if (!rolesById[cityHasRole.role.id]) {
                    rolesById[cityHasRole.role.id] = {
                        role: cityHasRole.role,
                        quantity: 0
                    };
                }
                rolesById[cityHasRole.role.id].quantity += 1;
                includeImplicatedRoles(cityHasRole.role, rolesById);
            });
            city.rolesById = rolesById;

            $scope.city = city;

            var userMe = result[1];
            var userMeResidents = $.grep(city.residents, function(someResident) {
                return someResident.user_id == userMe.id;
            });
            if (userMeResidents.length > 0)
                $scope.resident = userMeResidents[0];



            $scope.dayNumberMax = city.current_day.number + 1;
            $scope.dayNumberMin = Math.max($scope.dayNumberMax - ACTION_RESULTS_DAYS_PER_PAGE, 0);

            if ($scope.resident) {
                var savedRole = $scope.resident.saved_role;
                if (savedRole && savedRole.id) {
                    $scope.resident.role = savedRole;
                    getActionResults(cityId, savedRole.id, $scope.dayNumberMin, $scope.dayNumberMax);
                } else if ($scope.resident) {
                    // user has probably manually deleted the cookie containing their role id
                    $scope.basicValidationErrors.push({msg: 'Select your role.' });
                    $scope.roleChooserEditMode = true;
                    $scope.isLoading = false;
                }
            } else {
                getActionResults(cityId, null, $scope.dayNumberMin, $scope.dayNumberMax);
            }

        }, function(reason) {
            $scope.isLoading = false;
        });
    }

    function includeImplicatedRoles(role, rolesById) {
        angular.forEach(role.implicated_roles, function (implicatedRole) {
            if (!rolesById[implicatedRole.id]) {
                rolesById[implicatedRole.id] = {
                    role: implicatedRole,
                    quantity: 0
                };
                includeImplicatedRoles(implicatedRole, rolesById);
            }
        });
    }


    function hasEarlierActionResults() {
        return $scope.dayNumberMin > 0;
    }

    function loadEarlierActionResults() {
        if ($scope.dayNumberMin > 0) {

            $scope.dayNumberMin = Math.max(0, $scope.dayNumberMin - ACTION_RESULTS_DAYS_PER_PAGE);
            $scope.dayNumberMax = $scope.dayNumberMin + ACTION_RESULTS_DAYS_PER_PAGE;
            $timeout(function() {
                $scope.isLoadingActionResults = true;
            });
            getActionResults($scope.city.id, $scope.resident.role.id, $scope.dayNumberMin, $scope.dayNumberMax);
        }
    }

    function hasMoreRecentActionResults() {
        if (!$scope.city)
            return false;

        return $scope.dayNumberMax <= $scope.city.current_day.number;
    }

    function loadMoreRecentActionResults() {
        if ($scope.dayNumberMax <= $scope.city.current_day.number) {
            $scope.dayNumberMax = Math.min($scope.dayNumberMax + ACTION_RESULTS_DAYS_PER_PAGE, $scope.city.current_day.number+1);
            $scope.dayNumberMin = $scope.dayNumberMax - ACTION_RESULTS_DAYS_PER_PAGE;
            $timeout(function() {
                $scope.isLoadingActionResults = true;
            });
            getActionResults($scope.city.id, $scope.resident.role.id, $scope.dayNumberMin, $scope.dayNumberMax);
        }
    }

    function getActionResults(cityId, roleId, dayNumberMin, dayNumberMax) {

        actionResultsService.getActionResults(cityId, roleId, dayNumberMin, dayNumberMax).then(function(result) {
            initActionResults(result);

            $timeout(function() {
                $scope.isLoading = false;
                $scope.isLoadingActionResults = false;
            });

        }, function(reason) {
            $timeout(function() {
                $scope.isLoading = false;
                $scope.isLoadingActionResults = false;
                angular.forEach(reason.httpObj.responseJSON, function(error) {
                    $scope.basicValidationErrors.push({type : 'danger', msg: error });
                });
            });
        });
    }

    function initActionResults(actionResults) {
        if (!actionResults)
            return;

        var actionResultsByType = {};
        angular.forEach(actionResults, function(someActionResult) {
            if (!actionResultsByType[someActionResult.action_result_type.id])
                actionResultsByType[someActionResult.action_result_type.id] = [];

            actionResultsByType[someActionResult.action_result_type.id].push(someActionResult);
        });

        actionResultsByType = actionResultsService.patchedActionResultsByType(actionResultsByType, $scope.actionResultsByType);

        if (actionResultsByType[ACTION_RESULT_TYPE_ID_SELF_GENERATED_TYPE_RESIDENTS]) {

            var residentsResult = actionResultsByType[ACTION_RESULT_TYPE_ID_SELF_GENERATED_TYPE_RESIDENTS][0];
            if (residentsResult) {
                angular.forEach(residentsResult.result.residents, function(someResidentStatus) {
                    $scope.city.residentsById[someResidentStatus.id].alive = someResidentStatus.alive;
                });
                $scope.residentsResult = residentsResult;
            }
        } else {
            console.error("Entered game, but not SelfGenerated Result Residents is present.");
        }
        $scope.actionResultsByType = actionResultsByType;

        var gameOverResults = actionResultsByType[ACTION_RESULT_TYPE_ID_GAME_OVER];
        if (gameOverResults) {
            var gameOverResult = gameOverResults[0];
            if (gameOverResult) {
                var winnerAffiliations = gameOverResult.result.winner_affiliations;
                // $scope.gameOverResult = gameOverResult;
                var gameOverDeclarationOfWinners = '';
                angular.forEach(winnerAffiliations, function(someAffiliation) {
                    gameOverDeclarationOfWinners += someAffiliation.name + ' won. ';
                });
                $scope.gameOverDeclarationOfWinners = gameOverDeclarationOfWinners;
            }
        }

        $scope.actionResults = actionResults;
    }

    function setCookieRoleId(cityId, userId, roleId) {
        var expirationDate = new Date();
        expirationDate = new Date(expirationDate.getTime() + 1000*60*60*24*7); // 7 days from now
        setCookie(cityRoleIdCookieKey(cityId, userId), roleId, expirationDate);
    }

    function initCityHasRoles(city) {
        $scope.rolesPerId = {};
        angular.forEach(city.city_has_roles, function(someCityHasRole) {
            $scope.rolesPerId[someCityHasRole.role_id] = someCityHasRole;
        });
    }

    function roleSelected(roleId) {
        var shouldRefreshActionResults = $scope.resident.role == null;
        $scope.resident.role = $scope.city.rolesById[roleId].role;
        if (shouldRefreshActionResults)
            getActionResults($scope.city.id, roleId, $scope.dayNumberMin, $scope.dayNumberMax);
        setCookieRoleId($scope.city.id, authService.user.id, roleId);
    }

    function closeBasicValidationAlert(index) {
        $scope.basicValidationErrors.splice(index, 1);
    }

    function handleAlert(alert) {
        $scope.generalMessages.push(alert);
    }

    function closeGeneralMessageAlert(index) {
        $scope.generalMessages.splice(index, 1);
    }

    function cityRoleIdCookieKey(cityId, userId) {
        if (!cityId)
            return null;

        if (!userId)
            return null;

        return 'city' + cityId + 'UserId' + userId + 'RoleId';
    }

    var kCitySelectedTabIndexCookieKey;

    function joinDiscussion() {
        $location.path('cities/'+ $scope.city.id + '/discussion');
    }

    init();

    function init() {
        var cityId = $routeParams["cityId"];

        kCitySelectedTabIndexCookieKey = 'city_' + cityId + '_active_tabs';

        initCity(cityId);

        $scope.refreshCountdownTicks = 0;

        $scope.basicValidationErrors = [];
        $scope.generalMessages = [];
        $scope.closeBasicValidationAlert = closeBasicValidationAlert;
        $scope.closeGeneralMessageAlert = closeGeneralMessageAlert;
        $scope.handleAlert = handleAlert;
        $scope.roleSelected = roleSelected;
        $scope.joinDiscussion = joinDiscussion;


        $scope.hasEarlierActionResults = hasEarlierActionResults;
        $scope.loadEarlierActionResults = loadEarlierActionResults;
        $scope.hasMoreRecentActionResults = hasMoreRecentActionResults;
        $scope.loadMoreRecentActionResults = loadMoreRecentActionResults;



        $scope.cityId = cityId;
        $scope.disqusUrl = $location.absUrl();
    }

});
