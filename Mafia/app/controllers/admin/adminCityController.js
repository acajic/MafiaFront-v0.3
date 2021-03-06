app.controller('AdminCityController',function ($scope, $routeParams, $location, $modal, $q, authService, layoutService, citiesService) {
    "use strict";

    init();

    function init() {
        layoutService.setHomeButtonVisible(true);
        layoutService.setAdminButtonVisible(true);

        $scope.alerts = [];

        var cityId = $routeParams['city_id'];
        var cityPromise = citiesService.getCity(cityId).then(function(cityResult) {
            setInspectedCity(cityResult);

            return cityResult;
        });


        var userMePromise = authService.userMe(false).then(function(userMeResult) {
            $scope.userMe = userMeResult;
            $scope.canSave = userMeResult.app_role.app_permissions[APP_PERMISSION_ADMIN_READ];
            $scope.canDelete = userMeResult.app_role.app_permissions[APP_PERMISSION_ADMIN_WRITE];

            return userMeResult;
        });


        $q.all([cityPromise, userMePromise]).then(function (results) {
            var inspectedCity = results[0];
            var userMe = results[1];
            $scope.canTriggerPhases = inspectedCity.started_at && !inspectedCity.finished_at && userMe.app_role.app_permissions[APP_PERMISSION_ADMIN_READ];
            $scope.canChangeAvailability = !inspectedCity.started_at && userMe.app_role.app_permissions[APP_PERMISSION_ADMIN_READ];
        });

    }

    function setInspectedCity(city) {
        $scope.inspectedCity = city;
        initTimezone();
    }

    var initTimezone = function() {
        if (!$scope.inspectedCity || $scope.inspectedCity.timezone === undefined)
            return;

        $scope.timezoneString = ($scope.inspectedCity.timezone >= 0 ? '+' : '-') + $scope.minutesToString(Math.abs(parseInt($scope.inspectedCity.timezone)))
    };

    $scope.minutesToString = citiesService.minutesToString;

    $scope.saveCity = function() {
        $scope.isProcessing = true;

        return citiesService.updateCity($scope.inspectedCity).then(function(cityResult) {
            $scope.isProcessing = false;


            setInspectedCity(cityResult);
            $scope.alerts.push({type: 'success', msg: 'Successfully updated'});
        }, function(reason) {
            $scope.isProcessing = false;
            $scope.alerts.push({type: 'danger', msg: 'Error updating city'});
        });
    };

    $scope.cancel = function() {
        $location.path('admin');
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.deleteCity = function() {
        openDeletionModal();
    };

    var openDeletionModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'deleteModalContent.html',
            controller: DeleteCityModalInstanceCtrl,
            resolve: {
            }
        });

        modalInstance.result.then(function () {
            var deleteCityPromise = citiesService.deleteCity($scope.inspectedCity.id);
            deleteCityPromise.then(function() {
                citiesService.cityDeleted = $scope.inspectedCity;
                $location.path('admin');
            }, function(reason) {
                $scope.alerts.push({type: 'danger', msg: "City is not deleted." });
            });

        }, function () {
        });
    };

    var DeleteCityModalInstanceCtrl = function ($scope, $modalInstance) {

        $scope.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };


    $scope.triggerDayStart = function() {
        openTriggerDayStartModal();

    };

    var openTriggerDayStartModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'triggerDayStartModal.html',
            controller: TriggerDayStartModalInstanceCtrl,
            resolve: {
            }
        });

        modalInstance.result.then(function () {
            $scope.isTriggeringGamePhase = true;
            citiesService.triggerDayStart($scope.inspectedCity.id).then(function(updatedCityResult) {
                $scope.isTriggeringGamePhase = false;

                setInspectedCity(updatedCityResult);
                $scope.alerts.push({type: 'success', msg: "Day start successfully triggered." });
            }, function(reason) {
                $scope.isTriggeringGamePhase = false;
                $scope.alerts.push({type: 'danger', msg: "Day start not triggered." });
            });

        }, function () {
        });
    };

    var TriggerDayStartModalInstanceCtrl = function ($scope, $modalInstance) {

        $scope.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };



    $scope.triggerNightStart = function() {
        openTriggerNightStartModal();
    };

    var openTriggerNightStartModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'triggerNightStartModal.html',
            controller: TriggerNightStartModalInstanceCtrl,
            resolve: {
            }
        });

        modalInstance.result.then(function () {
            $scope.isTriggeringGamePhase = true;
            citiesService.triggerNightStart($scope.inspectedCity.id).then(function(updatedCityResult) {
                $scope.isTriggeringGamePhase = false;

                setInspectedCity(updatedCityResult);
                $scope.alerts.push({type: 'success', msg: "Night start successfully triggered." });
            }, function(reason) {
                $scope.isTriggeringGamePhase = false;
                $scope.alerts.push({type: 'danger', msg: "Night start not triggered." });
            });

        }, function () {
        });
    };

    var TriggerNightStartModalInstanceCtrl = function ($scope, $modalInstance) {

        $scope.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };
});