app.directive('teller', function() {
    "use strict";
    return {
        restrict : 'E',
        templateUrl: 'app/directiveTemplates/domain/roles/teller.html',
        link: function(scope, element, attrs) {
            "use strict";


            scope.$watch('actionResults', function(actionResults) {
                if (!actionResults)
                    return;

                var index = actionResults.indexOfMatchFunction(function(actionResult) {
                    return actionResult.action_result_type.id ==ACTION_RESULT_TYPE_ID_SELF_GENERATED_TYPE_ACTION_TYPE_PARAMS;
                });

                if (index >= 0) {
                    var actionTypeParamsPerRolePerActionType = actionResults[index].result['action_types_params'];

                    if (actionTypeParamsPerRolePerActionType[ROLE_ID_TELLER]) {
                        if (actionTypeParamsPerRolePerActionType[ROLE_ID_TELLER][ACTION_TYPE_ID_TELLER_VOTES]) {
                            var tellerVotesActionTypeParams = actionTypeParamsPerRolePerActionType[ROLE_ID_TELLER][ACTION_TYPE_ID_TELLER_VOTES];

                            var numOfActionsAvailable = tellerVotesActionTypeParams['number_of_actions_available'];
                            scope.numOfActionsAvailable = numOfActionsAvailable;
                        }
                    }

                }


            }, true);


            scope.roleId = ROLE_ID_TELLER;

        }
    };
});