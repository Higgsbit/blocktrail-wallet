angular.module('blocktrail.wallet')
    .controller('BuyBTCChooseCtrl', function($q, $scope, $state, $rootScope, $cordovaDialogs, settingsService, $ionicLoading,
                                             $translate, $ionicScrollDelegate, glideraService, $log) {
        var okRegions = [
            'US-CA',
            'US-'
        ];

        // load chooseRegion from settingsService
        //  show loading spinner while we wait (should be microseconds)
        $scope.chooseRegion = null;
        $ionicLoading.show({
            template: "<div>{{ 'WORKING' | translate }}...</div><ion-spinner></ion-spinner>",
            hideOnStateChange: true
        });
        settingsService.$isLoaded().then(function() {
            $scope.chooseRegion = _.defaults({}, settingsService.buyBTCRegion, {
                region: null,
                name: null,
                regionOk: okRegions.indexOf(settingsService.buyBTCRegion ? settingsService.buyBTCRegion.region : null) !== -1
            });

            $ionicLoading.hide();
        });

        $scope.selectRegion = function(region, name) {
            $log.debug('selectRegion: ' + region + ' (' + name + ')');
            $scope.chooseRegion.region = region;
            $scope.chooseRegion.name = name;
            $scope.chooseRegion.regionOk = okRegions.indexOf(region) !== -1;

            $ionicScrollDelegate.scrollTop();

            settingsService.$isLoaded().then(function() {
                settingsService.buyBTCRegion = _.defaults({}, $scope.chooseRegion);
                return settingsService.$store();
            })
        };

        $scope.goGlideraBrowser = function() {
            glideraService.userCanTransact().then(function(userCanTransact) {
                if (!userCanTransact) {
                    return glideraService.accessToken().then(function(accessToken) {
                        if (accessToken) {
                            return settingsService.$isLoaded().then(function() {
                                // 2: Additional user verification information is required
                                if (settingsService.glideraAccessToken.userCanTransactInfo.code == 2) {
                                    return $cordovaDialogs.confirm(
                                        $translate.instant('MSG_BUYBTC_SETUP_MORE_GLIDERA_BODY', {
                                            message: settingsService.glideraAccessToken.userCanTransactInfo.message
                                        }).sentenceCase(),
                                        $translate.instant('MSG_BUYBTC_SETUP_MORE_GLIDERA_TITLE').capitalize(),
                                        [$translate.instant('OK'), $translate.instant('CANCEL').sentenceCase()]
                                    )
                                        .then(function(dialogResult) {
                                            if (dialogResult == 2) {
                                                return;
                                            }

                                            return glideraService.setup();
                                        })
                                    ;

                                } else if (settingsService.glideraAccessToken.userCanTransactInfo) {
                                    throw new Error("User can't transact because: " + settingsService.glideraAccessToken.userCanTransactInfo.message);
                                } else {
                                    throw new Error("User can't transact for unknown reason!");
                                }
                            });

                        } else {
                            return $cordovaDialogs.confirm(
                                $translate.instant('MSG_BUYBTC_SETUP_GLIDERA_BODY').sentenceCase(),
                                $translate.instant('MSG_BUYBTC_SETUP_GLIDERA_TITLE').capitalize(),
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
                })
            ;
        };

        $scope.resetBuyBTC = function() {
            return settingsService.$isLoaded().then(function() {
                settingsService.glideraAccessToken = null;
                settingsService.buyBTCRegion = null;

                return settingsService.$store();
            })
                .then(function() {
                    $state.go('app.wallet.summary');
                }, function(err) {
                    alert(err);
                })
            ;
        };
    })
;

angular.module('blocktrail.wallet')
    .controller('BuyBTCChooseRegionCtrl', function($q, $scope, $log) {
        var BROKERS = {
            GLIDERA: 'glidera'
        };
        $scope.usSelected = false;
        $scope.usStates = [
            {region: 'US-AL', name: 'Alabama', brokers: []},
            {region: 'US-AK', name: 'Alaska', brokers: []},
            {region: 'US-AZ', name: 'Arizona', brokers: [BROKERS.GLIDERA]},
            {region: 'US-AR', name: 'Arkansas', brokers: []},
            {region: 'US-CA', name: 'California', brokers: [BROKERS.GLIDERA]},
            {region: 'US-CO', name: 'Colorado', brokers: [BROKERS.GLIDERA]},
            {region: 'US-CT', name: 'Connecticut', brokers: []},
            {region: 'US-DE', name: 'Delaware', brokers: [BROKERS.GLIDERA]},
            {region: 'US-DC', name: 'District of Columbia', brokers: []},
            {region: 'US-FL', name: 'Florida', brokers: []},
            {region: 'US-GA', name: 'Georgia', brokers: [BROKERS.GLIDERA]},
            {region: 'US-HI', name: 'Hawaii', brokers: []},
            {region: 'US-ID', name: 'Idaho', brokers: []},
            {region: 'US-IL', name: 'Illinois', brokers: [BROKERS.GLIDERA]},
            {region: 'US-IN', name: 'Indiana', brokers: []},
            {region: 'US-IA', name: 'Iowa', brokers: []},
            {region: 'US-KS', name: 'Kansas', brokers: [BROKERS.GLIDERA]},
            {region: 'US-KY', name: 'Kentucky', brokers: []},
            {region: 'US-LA', name: 'Louisiana', brokers: []},
            {region: 'US-ME', name: 'Maine', brokers: [BROKERS.GLIDERA]},
            {region: 'US-MD', name: 'Maryland', brokers: [BROKERS.GLIDERA]},
            {region: 'US-MA', name: 'Massachusetts', brokers: [BROKERS.GLIDERA]},
            {region: 'US-MI', name: 'Michigan', brokers: []},
            {region: 'US-MN', name: 'Minnesota', brokers: []},
            {region: 'US-MS', name: 'Mississippi', brokers: []},
            {region: 'US-MO', name: 'Missouri', brokers: [BROKERS.GLIDERA]},
            {region: 'US-MT', name: 'Montana', brokers: [BROKERS.GLIDERA]},
            {region: 'US-NE', name: 'Nebraska', brokers: []},
            {region: 'US-NV', name: 'Nevada', brokers: [BROKERS.GLIDERA]},
            {region: 'US-NH', name: 'New Hampshire', brokers: []},
            {region: 'US-NJ', name: 'New Jersey', brokers: [BROKERS.GLIDERA]},
            {region: 'US-NM', name: 'New Mexico', brokers: [BROKERS.GLIDERA]},
            {region: 'US-NY', name: 'New York', brokers: []},
            {region: 'US-NC', name: 'North Carolina', brokers: [BROKERS.GLIDERA]},
            {region: 'US-ND', name: 'North Dakota', brokers: []},
            {region: 'US-OH', name: 'Ohio', brokers: []},
            {region: 'US-OK', name: 'Oklahoma', brokers: []},
            {region: 'US-OR', name: 'Oregon', brokers: []},
            {region: 'US-PA', name: 'Pennsylvania', brokers: [BROKERS.GLIDERA]},
            {region: 'US-RI', name: 'Rhode Island', brokers: []},
            {region: 'US-SC', name: 'South Carolina', brokers: [BROKERS.GLIDERA]},
            {region: 'US-SD', name: 'South Dakota', brokers: [BROKERS.GLIDERA]},
            {region: 'US-TN', name: 'Tennessee', brokers: [BROKERS.GLIDERA]},
            {region: 'US-TX', name: 'Texas', brokers: [BROKERS.GLIDERA]},
            {region: 'US-UT', name: 'Utah', brokers: [BROKERS.GLIDERA]},
            {region: 'US-VT', name: 'Vermont', brokers: []},
            {region: 'US-VA', name: 'Virginia', brokers: []},
            {region: 'US-WA', name: 'Washington', brokers: []},
            {region: 'US-WV', name: 'West Virginia', brokers: []},
            {region: 'US-WI', name: 'Wisconsin', brokers: [BROKERS.GLIDERA]},
            {region: 'US-WY', name: 'Wyoming', brokers: []}
        ];

        $scope.selectUS = function() {
            $scope.usSelected = true;
        };
    })
;

angular.module('blocktrail.wallet')
    .controller('BuyBTCGlideraOauthCallbackCtrl', function($scope, $state, $rootScope, $ionicLoading, glideraService) {
        glideraService.handleOauthCallback($rootScope.glideraCallback)
            .then(function() {
                return glideraService.userCanTransact().then(function(userCanTransact) {
                    if (userCanTransact) {
                        $state.go('app.wallet.buybtc.buy', {provider: 'glidera'});
                    } else {
                        $state.go('app.wallet.buybtc.choose');
                    }
                })
            }, function(err) {
                alert(err);
            })
        ;
    })
;


angular.module('blocktrail.wallet')
    .controller('BuyBTCGlideraBitIDCallbackCtrl', function($scope, $state, $rootScope, $ionicLoading, settingsService) {
    })
;


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

        /*
         * init buy getting an access token, repeat until we have an access token
         *  then update main price and set interval for updating price
         */
        var init = function() {
            $ionicLoading.show({
                template: "<div>{{ 'WORKING' | translate }}...</div><ion-spinner></ion-spinner>",
                hideOnStateChange: true
            });

            return glideraService.accessToken()
                .then(function(accessToken) { return accessToken; }, function(err) { return null; })
                .then(function(accessToken) {
                    if (!accessToken) {
                        return init();
                    }

                    $ionicLoading.hide();

                    // update main price for display straight away
                    updateMainPrice();

                    // update every minute
                    $interval(function() {
                        // update main price
                        updateMainPrice();
                        // update input price
                        updateInputPrice();
                    }, 60 * 1000);
                })
            ;
        };

        init();

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
                                );

                                $state.go('app.wallet.summary');
                            })
                        ;
                    })
                    .then(function() {
                        // -
                    }, function(err) {
                        if (err != "CANCELLED") {
                            alert(err);
                        }
                    })
                ;
            }
        };
    })
;
