app.directive('journalistInvestigate', function(actionsService) {
    "use strict";
    return {
        restrict : 'E',
        templateUrl: 'app/directiveTemplates/domain/actions/journalistInvestigate.html',
        link: function(scope, element, attrs) {
            "use strict";


            scope.investigateOnSelect = function(selectedResident) {
                if (!selectedResident)
                    return;

                var postActionPromise = actionsService.postAction(scope.city.id,
                    scope.roleId,
                    ACTION_TYPE_ID_JOURNALIST_INVESTIGATE,
                    scope.city.current_day_id,
                    { target_id : selectedResident.id });

                postActionPromise.then(function() {
                    scope.infos = [{type:"success", msg: "Investigating " + selectedResident.username + ". Results of investigation available on the next morning."}];
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
                var cancelUnprocessedActionsPromise = actionsService.cancelUnprocessedActions(scope.city.id, scope.roleId, ACTION_TYPE_ID_JOURNALIST_INVESTIGATE);
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