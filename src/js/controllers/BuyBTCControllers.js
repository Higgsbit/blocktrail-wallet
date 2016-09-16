angular.module('blocktrail.wallet')
    .controller('BuyBTCChooseCtrl', function($q, $scope, $state, $rootScope, $cordovaDialogs, settingsService, $ionicLoading,
                                             $translate, glideraService) {
            $scope.goGlideraBrowser = function() {
                glideraService.userCanTransact().then(function(userCanTransact) {
                    if (!userCanTransact) {
                        return glideraService.accessToken().then(function(accessToken) {
                            if (accessToken) {
                                throw new Error("User can't transact!");
                            } else {
                                return $cordovaDialogs.confirm(
                                    $translate.instant('MSG_BUYBTC_EXTERNAL_BODY').sentenceCase(),
                                    $translate.instant('MSG_BUYBTC_EXTERNAL_TITLE').capitalize(),
                                    [$translate.instant('OK'), $translate.instant('CANCEL').sentenceCase()]
                                )
                                    .then(function(dialogResult) {
                                        if (dialogResult == 2) {
                                            return;
                                        }

                                        return glideraService.oauth2();
                                    })
                                ;
                            }
                        });
                    } else {
                        $state.go('app.wallet.buybtc.buy', {provider: 'glidera'});
                    }
                })
                .then(function() {
                    // -
                }, function(err) {
                    alert(err);
                });
            };

            $scope.resetBuyBTC = function() {
                return settingsService.$isLoaded().then(function() {
                    settingsService.glideraAccessToken = null;

                    return settingsService.$store();
                })
                    .then(function() {
                        alert('reset buy BTC state');
                        $state.go('app.wallet.buybtc.choose');
                    }, function(err) {
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
                $state.go('app.wallet.buybtc.buy', {provider: 'glidera'});
            }, function(err) {
                alert(err);
            });
        }
    );


angular.module('blocktrail.wallet')
    .controller('BuyBTCGlideraBitIDCallbackCtrl', function($scope, $state, $rootScope, $ionicLoading, settingsService) {
        }
    );


angular.module('blocktrail.wallet')
    .controller('BuyBTCBuyCtrl', function($scope, $state, $rootScope, $ionicLoading, $cordovaDialogs, glideraService,
                                          $stateParams, $timeout, $interval, $translate, $filter, CurrencyConverter) {
        $scope.buyProvider = $stateParams.provider;

        $scope.fetchingMainPrice = true;
        $scope.priceBTC = null;
        $scope.priceBTCCurrency = 'USD';
        $scope.fetchingInputPrice = false;
        $scope.fiatFirst = false;
        $scope.priceUuid = null;
        $scope.sendInput = {
            btcValue: 0.00,
            fiatValue: 0.00,
            feeValue: null,
            feePercentage: null,
            recipientAddress: null,
            referenceMessage: "",
            pin: null,

            recipient: null,        //contact object when sending to contact
            recipientDisplay: null,  //recipient as displayed on screen
            recipientSource: null
        };

        $scope.swapInputs = function() {
            if (!$scope.fiatFirst && $scope.settings.localCurrency != 'USD') {
                return $cordovaDialogs.confirm(
                    $translate.instant('MSG_BUYBTC_FIAT_USD_ONLY', {
                        currency: 'USD',
                        yourCurrency: $scope.settings.localCurrency
                    }).sentenceCase(),
                    $translate.instant('MSG_BUYBTC_FIAT_USD_ONLY_TITLE').capitalize(),
                    [$translate.instant('OK'), $translate.instant('CANCEL').sentenceCase()]
                )
                    .then(function(dialogResult) {
                        if (dialogResult == 2) {
                            return;
                        }

                        $scope.fiatFirst = !$scope.fiatFirst;
                    })
                ;
            } else {
                $scope.fiatFirst = !$scope.fiatFirst;
            }
        };

        $scope.setFiat = function() {
            updateInputPrice();
        };
        $scope.setBTC = function() {
            updateInputPrice();
        };

        var updateMainPrice = function() {
            $scope.fetchingMainPrice = true;

            glideraService.buyPrices(1.0).then(function(result) {
                $scope.priceBTC = result.total;

                $scope.fetchingMainPrice = false;
            });
        };

        var updateInputPrice = function() {
            $scope.fetchingInputPrice = true;

            if ($scope.fiatFirst) {
                $scope.sendInput.btcValue = null;
                $scope.sendInput.feeValue = null;

                glideraService.buyPrices(null, $scope.sendInput.fiatValue).then(function(result) {
                    $scope.sendInput.btcValue = parseFloat(result.qty);
                    $scope.sendInput.feeValue = parseFloat(result.fees);
                    $scope.sendInput.feePercentage = ($scope.sendInput.feeValue / $scope.sendInput.fiatValue) * 100;
                    $scope.priceUuid = result.priceUuid;
                    $scope.fetchingInputPrice = false;
                });
            } else {
                $scope.sendInput.fiatValue = null;
                $scope.sendInput.feeValue = null;

                glideraService.buyPrices($scope.sendInput.btcValue, null).then(function(result) {
                    $scope.sendInput.fiatValue = parseFloat(result.total);
                    $scope.sendInput.feeValue = parseFloat(result.fees);
                    $scope.sendInput.feePercentage = ($scope.sendInput.feeValue / $scope.sendInput.fiatValue) * 100;
                    $scope.priceUuid = result.priceUuid;
                    $scope.fetchingInputPrice = false;
                });
            }
        };

        // update main price for display straight away
        updateMainPrice();

        // @TODO: DEBUG
        // $scope.sendInput.btcValue = 0.02;
        // updateInputPrice();

        // update every minute
        $interval(function() {
            // update main price
            updateMainPrice();
            // update input price
            updateInputPrice();
        }, 60 * 1000);

        $scope.buyBTC = function() {
            if ($scope.buyProvider == 'glidera') {

                return $cordovaDialogs.confirm(
                    $translate.instant('MSG_BUYBTC_CONFIRM_BODY', {
                        qty: $filter('number')($scope.sendInput.btcValue, 6),
                        price: $filter('number')($scope.sendInput.fiatValue, 2),
                        fee: $filter('number')($scope.sendInput.feeValue, 2),
                        currencySymbol: $filter('toCurrencySymbol')('USD')
                    }).sentenceCase(),
                    $translate.instant('MSG_BUYBTC_CONFIRM_TITLE').capitalize(),
                    [$translate.instant('OK'), $translate.instant('CANCEL').sentenceCase()]
                )
                    .then(function(dialogResult) {
                        if (dialogResult == 2) {
                            return;
                        }

                        return glideraService.buy($scope.sendInput.btcValue, $scope.priceUuid)
                            .then(function(result) {
                                $cordovaDialogs.alert(
                                    $translate.instant('MSG_BUYBTC_BOUGHT_BODY', {
                                        qty: $filter('number')($scope.sendInput.btcValue, 6),
                                        price: $filter('number')($scope.sendInput.fiatValue, 2),
                                        fee: $filter('number')($scope.sendInput.feeValue, 2),
                                        currencySymbol: $filter('toCurrencySymbol')('USD')
                                    }).sentenceCase(),
                                    $translate.instant('MSG_BUYBTC_BOUGHT_TITLE').capitalize(),
                                    $translate.instant('OK')
                                )

                                $state.go('app.wallet.summary');
                            })
                        ;
                    })
                    .then(function() {
                        // -
                    }, function(err) {
                        alert(err);
                    })
                ;
            }
        }
    }
);
