var sampleApp = angular.module('app', ['ngCookies', 'ngResource']);

/**
 * $http interceptor.
 * On 401 response - it stores the request and broadcasts 'event:loginRequired'.
 */
angular.module('app').config(function ($httpProvider) {
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    var interceptor = ['$rootScope', '$q', function (scope, $q) {

        function success(response) {
            return response;
        }

        function error(response) {
            var status = response.status;

            if (status === 401) {
                var deferred = $q.defer();
                var req = {
                    config: response.config,
                    deferred: deferred
                };
                //scope.requests401.push(req);
                scope.$broadcast('event:auth-loginRequired');
                return deferred.promise;
            }
            // otherwise
            return $q.reject(response);

        }

        return function (promise) {
            return promise.then(success, error);
        }

    }];
    $httpProvider.responseInterceptors.push(interceptor);
});

angular.module('app').directive('loginDialog', function () {
    return {
        templateUrl: 'app/templates/loginDialog.html',
        restrict: 'E',
        replace: true,
        controller: 'CredentialsController',
        link: function (scope, element, attributes, controller) {
            scope.$on('event:auth-loginRequired', function () {
                console.log("got login event");
                element.modal('show');
            });

            scope.$on('event:auth-loginConfirmed', function () {
                element.modal('hide');
                scope.credentials.password = '';
            });
        }
    }
});