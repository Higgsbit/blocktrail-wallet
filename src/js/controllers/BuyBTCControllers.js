angular.module('blocktrail.wallet')
    .controller('BuyBTCChooseCtrl', function($q, $scope, $rootScope, $cordovaDialogs, settingsService, $ionicLoading, $translate, glideraService, Wallet) {
            $scope.goGlideraBrowser = function() {
                glideraService.userCanTransact().then(function(userCanTransact) {
                    if (!userCanTransact) {
                        return glideraService.accessToken().then(function(accessToken) {
                            if (accessToken) {
                                throw new Error("User can't transact!");
                            } else {
                                return glideraService.oauth2();
                            }
                        });
                    } else {
                        var qty = 0.1
                        return glideraService.buyPrices(qty)
                            .then(function(result) {
                                return glideraService.buy(qty, result.priceUuid);
                            })
                        ;
                    }
                })
                .then(function() {
                    },
                    function(err) {
                        alert(err);
                    })
                ;
            };
        }
    );

angular.module('blocktrail.wallet')
    .controller('BuyBTCGlideraOauthCallbackCtrl', function($scope, $state, $rootScope, $ionicLoading, glideraService) {
        glideraService.handleOauthCallback($rootScope.glideraCallback)
            .then(function() {
                $state.go('app.wallet.buybtc.choose');
            }, function(err) {
                alert(err);
            });
        }
    );


angular.module('blocktrail.wallet')
    .controller('BuyBTCGlideraBitIDCallbackCtrl', function($scope, $state, $rootScope, $ionicLoading, settingsService) {
        }
    );
