app.directive('protect', function(actionsService) {
    "use strict";
    return {
        restrict : 'E',
        templateUrl: 'app/directiveTemplates/domain/actions/protect.html',
        link: function(scope, element, attrs) {
            "use strict";

            scope.protectOnSelect = function(selectedResident) {
                if (!selectedResident)
                    return;

                var postActionPromise = actionsService.postAction(scope.city.id,
                    scope.roleId,
                    ACTION_TYPE_ID_PROTECT,
                    scope.city.current_day_id,
                    { target_id : selectedResident.id });

                postActionPromise.then(function() {
                    scope.infos = [{type:"success", msg: "Protecting " + selectedResident.username + ". Mafia will not be able to kill this resident this night."}];
                }, function(reason) {
                    angular.forEach(reason.httpObj.responseJSON, function(error) {
                        scope.infos.push({type : 'danger', msg: error })
                    });
                });

            };

            scope.closeInfoAlert = function(index) {
                scope.infos.splice(index, 1);
            };

            scope.cancelUnprocessedActions = function() {
                var cancelUnprocessedActionsPromise = actionsService.cancelUnprocessedActions(scope.city.id, scope.roleId, ACTION_TYPE_ID_PROTECT);

                cancelUnprocessedActionsPromise.then(function() {
                    scope.infos = [{type:"success", msg: "Canceled unprocessed actions."}];
                }, function(reason) {
                    angular.forEach(reason.httpObj.responseJSON, function(error) {
                        scope.infos.push({type : 'danger', msg: error })
                    });
                });
            };
        }
    };
});