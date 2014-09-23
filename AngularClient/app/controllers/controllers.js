var baseUrl = 'http://localhost:49587/api';
angular.module('app').controller('SampleController', function ($scope, $http, $cookieStore, Base64) {

    $scope.refreshData = function () {
        //Used to display the data  
        if ($cookieStore.get('basicCredentials'))
        {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $cookieStore.get('basicCredentials');
        }

        $http.get(baseUrl + '/Values').success(function (data) {
            $scope.Model = data;
            $scope.loading = false;
            $scope.currentUser = Base64.decode($cookieStore.get('basicCredentials')).split(":")[0];
        })
        .error(function () {
            $scope.error = "An Error has occured while loading data";
            $scope.loading = false;
        });
    }

    $scope.loading = true;
    $scope.refreshData();

    $scope.logout = function () {
        $cookieStore.remove('basicCredentials');
        $scope.currentUser = null;
        $scope.Model = null;
        $http.defaults.headers.common.Authorization = '';
        $scope.refreshData();
    }

    $scope.updateValue = function (model) {
        $http.put(baseUrl + '/Values', model);
        window.setTimeout(function () { $scope.refreshData() }, 1000);
        ;
    }
    
    $scope.$on('event:auth-loginConfirmed', function () {
        $scope.refreshData();
    });

});

function CredentialsController($scope, $http, $cookieStore, Base64) {
    $scope.login = function (userName, password) {
        var encodedUserNameAndPassword = Base64.encode(userName + ':' + password);
        $http.defaults.headers.common['Authorization'] = 'Basic ' + encodedUserNameAndPassword;
        $cookieStore.put('basicCredentials', encodedUserNameAndPassword);
        $http.get(baseUrl + '/Values')
        .success(function() {
            $scope.$broadcast('event:auth-loginConfirmed');
            $scope.password = '';
        })
        .error(function() {
            $scope.error = 'Invalid Login';
            } );
        
    };
};
