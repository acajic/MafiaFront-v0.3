app.directive('investigateResult', function($timeout, actionResultsService) {
    "use strict";
    return {
        restrict : 'E',
        templateUrl: 'app/directiveTemplates/domain/actionResults/investigateResult.html',
        link: function(scope, element, attrs) {
            "use strict";


            scope.outcome = {
                success : false
            };

            scope.actionResultCopied = {};

            function init() {
                var actionResult = scope.actionResult;
                var result = actionResult.result;

                var city = scope.city;

                if (!actionResult || !actionResult.id) {
                    scope.actionResultCopied = {
                        action_result_type: {
                            id: ACTION_RESULT_TYPE_ID_INVESTIGATE
                        },
                        day: city.current_day
                    };
                } else {
                    angular.copy(scope.actionResult, scope.actionResultCopied);
                    scope.actionResultCopied.day = $.grep(city.days, function(someDay) {
                        return someDay.id == scope.actionResultCopied.day_id;
                    })[0];
                }

                if (!result)
                    return;

                var investigatedResident = angular.copy(scope.city.residentsById[result.target_id]);
                if (investigatedResident) {
                    if (result.success) {
                        scope.interpretation = "Resident " + investigatedResident.name + " is a mafia member.";
                    } else {
                        scope.interpretation = "Resident " + investigatedResident.name + " is not a mafia member.";
                    }
                } else {
                    scope.interpretation = "Error: ActionResult::Investigate -> result missing target_id.";
                }

                scope.investigatedResident = investigatedResident;
            }

            init();


            scope.toggleMode = function() {
                if (scope.city.finished_at || !scope.resident)
                    return;

                scope.editMode = !scope.editMode;
            };

            scope.selectInvestigatedResident = function(resident) {
                scope.investigatedResident = resident;
            };

            scope.blankActionResult = function() {
                scope.investigatedResident = null;
            };

            scope.deleteActionResult = function() {
                var deleteActionResultPromise = actionResultsService.deleteActionResult(scope.actionResult.id);
                deleteActionResultPromise.then(function() {
                    var index = scope.actionResults.indexOfMatchFunction(function(someActionResult) {
                        return someActionResult.id == scope.actionResult.id;
                    });

                    if (index < 0)
                        return;

                    $timeout(function() {
                        scope.actionResults.splice(index, 1);
                        scope.editMode = false;
                    });

                });
            };

            scope.submitActionResult = function() {
                var postActionResultPromise = actionResultsService.postActionResult(
                    scope.city.id,
                    scope.roleId,
                    scope.actionResultCopied.action_result_type,
                    scope.actionResultCopied.action_id,
                    scope.actionResultCopied.day.id,
                    {
                        target_id : scope.investigatedResident == null ? -1 : scope.investigatedResident.id,
                        success : scope.outcome.success
                    }
                );

                postActionResultPromise.then(function(createdActionResult) {
                    var index = scope.actionResults.indexOfMatchFunction(function(someActionResult) {
                        return someActionResult.id == scope.actionResult.id;
                    });

                    if (index < 0) {
                        scope.actionResults.splice(0, 0, createdActionResult);
                    } else {
                        scope.actionResults.splice(index, 1, createdActionResult);
                    }
                    scope.actionResult = createdActionResult;
                    init();

                    $timeout(function() {
                        if (scope.isNew)
                            scope.hide();
                        else {
                            scope.editMode = false;
                        }
                    });

                });
            };


        }
    };
});