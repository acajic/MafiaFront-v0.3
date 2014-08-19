var APP_ROLE_SUPER_ADMIN = 1;
var APP_ROLE_ADMIN = 2;
var APP_ROLE_GAME_CREATOR = 3;
var APP_ROLE_USER = 4;

app.factory('appRolesService', function($q, serverService) {
    "use strict";


    var allAppRolesPromise;

    var getAllAppRoles = function(refresh) {
        var deferred = $q.defer();

        if (!allAppRolesPromise) {
            allAppRolesPromise = serverService.get('app_roles');
        }

        return allAppRolesPromise.then(function(appRolesResult) {
            return appRolesResult;
        }, function(reason) {
            return reason;
        });

    };

    var getAllAppRolesByIds = function(refresh) {
        var allAppRolesPromise = getAllAppRoles(refresh);
        return allAppRolesPromise.then(function(allAppRolesResult) {
            var allAppRolesByIds = {};
            angular.forEach(allAppRolesResult, function(someAppRole) {
                allAppRolesByIds[someAppRole.id] = someAppRole;
            });
            return allAppRolesByIds;
        });
    };


    var getAllInitialAppRoles = function(queryModel, pageIndex, pageSize) {
        if (!queryModel)
            queryModel = {};

        var initialAppRolesPromise = serverService.get('initial_app_roles', {
            page_index: pageIndex,
            page_size: pageSize,
            description: queryModel.description,
            email: queryModel.email,
            email_pattern: queryModel.emailPattern,
            created_at_min: queryModel.createdAtMin ? queryModel.createdAtMin.getTime()/1000 : null,
            created_at_max: queryModel.createdAtMax ? queryModel.createdAtMax.getTime()/1000 : null,
            updated_at_min: queryModel.updatedAtMin ? queryModel.updatedAtMin.getTime()/1000 : null,
            updated_at_max: queryModel.updatedAtMax ? queryModel.updatedAtMax.getTime()/1000 : null
        });


        return initialAppRolesPromise.then(function(initialAppRolesResult) {
            return initialAppRolesResult;
        }, function(reason) {
            return reason;
        });

    };

    var getInitialAppRoleByIdPromisesByIds = {};

    var getInitialAppRoleById = function(initialAppRoleId, refresh) {
        if (!refresh && getInitialAppRoleByIdPromisesByIds[initialAppRoleId]) {
            return getInitialAppRoleByIdPromisesByIds[initialAppRoleId];
        }

        var initialAppRolePromise = serverService.get('initial_app_roles/' + initialAppRoleId);
        getInitialAppRoleByIdPromisesByIds[initialAppRoleId] = initialAppRolePromise;
        return initialAppRolePromise.then(function(initialAppRoleResult) {
            return initialAppRoleResult;
        });
    };

    var getNewInitialAppRole = function() {
        return serverService.get('initial_app_roles/new');
    };

    var postCreateInitialAppRole = function(initialAppRole) {
        return serverService.post('initial_app_roles', {initial_app_role : initialAppRole});
    };

    var putUpdateInitialAppRole = function(initialAppRole) {
        return serverService.put('initial_app_roles/' + initialAppRole.id, {
            initial_app_role: initialAppRole
        });
    };

    var deleteInitialAppRole = function(initialAppRoleId) {
        return serverService.delete('initial_app_roles/' + initialAppRoleId);
    };

    var notifications = {
        initialAppRoleCreated : null,
        initialAppRoleDeleted : null
    };

    return {
        getAllAppRoles : getAllAppRoles,
        getAllAppRolesByIds: getAllAppRolesByIds,
        getAllInitialAppRoles : getAllInitialAppRoles,
        getInitialAppRoleById : getInitialAppRoleById,
        getNewInitialAppRole : getNewInitialAppRole,
        postCreateInitialAppRole : postCreateInitialAppRole,
        putUpdateInitialAppRole : putUpdateInitialAppRole,
        deleteInitialAppRole: deleteInitialAppRole,
        notifications: notifications
    };
});