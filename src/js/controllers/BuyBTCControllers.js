angular.module('blocktrail.wallet')
    .controller('BuyBTCChooseCtrl', function($q, $scope, $rootScope, $cordovaDialogs, settingsService, $ionicLoading, $translate, Wallet) {
        var bitcoin = blocktrailSDK.bitcoin;

        $scope.goGlideraBrowser = function() {
            settingsService.$isLoaded().then(function() {
                if (settingsService.glideraAccessToken) {

                    var options = _.defaults({}, {
                        https: true,
                        host: 'sandbox.glidera.io',
                        endpoint: '/api/v1',
                        params: {},
                        headers: {
                            'Authorization': 'Bearer ' + settingsService.glideraAccessToken
                        },
                        contentMd5: false
                    });
                    var r = new Request(options);

                    return r.request('GET', '/user/status ', {}, null)
                        .then(function(result) {
                            console.log(result);
                            console.log(result.userCanTransact);

                            return settingsService.$isLoaded().then(function() {
                                // @TODO: encrypt with PIN
                                settingsService.glideraAccessToken.userCanTransact = result.userCanTransact;

                                return settingsService.$store().then(function() {

                                });
                            });
                        })
                        .then(function() {
                            $ionicLoading.hide();
                        })
                        .then(function() {}, function(err) {
                            console.error(err);
                            console.error("" + err);
                            console.error(err.msg);
                            console.error(err.message);
                            $ionicLoading.hide();
                            throw err;
                        })
                        ;

                } else {
                    var clientId = "9074010d6e573bd7b06645735ba315c8";
                    var returnuri = "btccomwallet://glideraCallback/oauth2";
                    var uuid = Math.ceil((new Date).getTime() / 1000);
                    var qs = [
                        'response_type=code',
                        'client_id=' + clientId,
                        'state=' + uuid,
                        'redirect_uri=' + returnuri
                    ];

                    var glideraUrl = "https://sandbox.glidera.io/oauth2/auth?" + qs.join("&");

                    console.log(glideraUrl);

                    window.open(glideraUrl, '_system');
                }
            });
        };

        $scope.goGlideraBitID = function() {
            var hdHighBit = 0x80000000;
            var glideraHdPath = "m/" + (hdHighBit - 1) +  "'/0'";
            var clientId = "9074010d6e573bd7b06645735ba315c8";
            // var returnuri = "urn:ietf:wg:oauth:2.0:oob";
            var returnuri = "btccomwallet://glideraCallback/bitid";

            return $cordovaDialogs.prompt(
                $translate.instant('MSG_ENTER_PIN').sentenceCase(),
                $translate.instant('SETUP_GLIDERA').sentenceCase(),
                    [$translate.instant('OK'), $translate.instant('CANCEL').sentenceCase()],
                    "",
                    true,   //isPassword
                    "tel"   //input type (uses html5 style)
                )
                .then(function(dialogResult) {
                    if (dialogResult.buttonIndex == 2) {
                        return $q.reject('CANCELLED');
                    }
                    //decrypt password with the provided PIN
                    $ionicLoading.show({template: "<div>{{ 'WORKING' | translate }}...</div><ion-spinner></ion-spinner>", hideOnStateChange: true});

                    return Wallet.unlock(dialogResult.input1).then(function(unlockData) {
                        return unlockData;
                    });
                })
            // return Wallet.unlock("0000")
                .then(function(wallet) {
                    var privKey = blocktrailSDK.Wallet.deriveByPath(wallet.primaryPrivateKey, glideraHdPath, "m/");
                    var address = privKey.getAddress().toBase58Check();

                    var uuid = Math.ceil((new Date).getTime() / 1000);
                    var bitidUri = "bitid://sandbox.glidera.io/bitid/auth?x=" + uuid;
                    var bitidSig = bitcoin.Message.sign(privKey.privKey, bitidUri).toString('base64');

                    var qs = [
                        'client_id=' + clientId,
                        'state=' + uuid,
                        'redirect_uri=' + returnuri,
                        'bitid_address=' + address,
                        'bitid_signature=' + encodeURIComponent(bitidSig),
                        'bitid_uri=' + "bitid://" + encodeURIComponent(bitidUri.replace("bitid://", "")) // funky, not encoding bitid://
                    ];

                    var glideraUrl = "https://sandbox.glidera.io/bitid/auth?" + qs.join("&");

                    settingsService.$isLoaded().then(function() {
                        settingsService.glideraRequest = {
                            uuid: uuid,
                            clientId: clientId,
                            bitidAddress: address,
                            bitidUri: bitidUri,
                            bitidSig: bitidSig
                        };
                        settingsService.$store()
                            .then(function() {
                                console.log(glideraUrl);

                                window.open(glideraUrl, '_system');
                            })
                    });
                })
            ;
        };
    }
);

angular.module('blocktrail.wallet')
    .controller('BuyBTCGlideraOauthCallbackCtrl', function($scope, $state, $rootScope, $ionicLoading, settingsService) {
        var Request = blocktrailSDK.Request;

        var clientId = "9074010d6e573bd7b06645735ba315c8";
        var clientSecret = "02cc9562bd2049b6fadb88578bc4c723";

        console.log('glideraCallback? ' + $scope.glideraCallback);
        if ($scope.glideraCallback) {
            var qs = parseQuery($scope.glideraCallback);

            console.log('code? ' + qs.code);

            if (qs.code) {
                var options = _.defaults({}, {
                    https: true,
                    host: 'sandbox.glidera.io',
                    endpoint: '/api/v1',
                    params: {},
                    contentMd5: false
                });
                var r = new Request(options);

                return r.request('POST', '/oauth/token', {}, {
                    grant_type: "authorization_code",
                    code: qs.code,
                    redirect_uri: "btccomwallet://glideraCallback/oauth2",
                    client_id: clientId,
                    client_secret: clientSecret
                })
                    .then(function(result) {
                        console.log(result.access_token);
                        console.log(result.scope);

                        return settingsService.$isLoaded().then(function() {
                            // @TODO: encrypt with PIN
                            settingsService.glideraAccessToken = {
                                accessToken: result.access_token,
                                scope: result.scope
                            };

                            return settingsService.$store().then(function() {

                            });
                        });
                    })
                    .then(function() {
                        $ionicLoading.hide();
                    })
                    .then(function() {}, function(err) {
                        console.error(err);
                        console.error("" + err);
                        console.error(err.msg);
                        console.error(err.message);
                        $ionicLoading.hide();
                        throw err;
                    })
                ;

            } else {
                $scope.errorMsg = 'GLIDERA_ERR';
                $scope.errorDetails = qs.error_message.replace("+", " ");
                $ionicLoading.hide();
            }
        } else {
            $state.go('app.wallet.summary');
        }
    }
);


angular.module('blocktrail.wallet')
    .controller('BuyBTCGlideraBitIDCallbackCtrl', function($scope, $state, $rootScope, $ionicLoading, settingsService) {
            var Request = blocktrailSDK.Request;
            console.log('glideraCallback? ' + $scope.glideraCallback);
            if ($scope.glideraCallback) {
                var qs = parseQuery($scope.glideraCallback);

                console.log(qs.status);

                if (qs.status == 'SUCCESS') {
                    settingsService.$isLoaded().then(function() {
                        console.log('isloaded');
                        console.log(settingsService.glideraRequest);
                        console.log(settingsService.glideraRequest.uuid);
                        var options = _.defaults({}, {
                            https: true,
                            host: 'sandbox.glidera.io',
                            endpoint: '/api/v1',
                            params: {},
                            headers: _.defaults({}, {
                                'X-CLIENT-ID': settingsService.glideraRequest.clientId,
                                'X-BITID-ADDRESS': settingsService.glideraRequest.bitidAddress,
                                'X-BITID-URI': settingsService.glideraRequest.bitidUri,
                                'X-BITID-SIGNATURE': settingsService.glideraRequest.bitidSig
                            })
                        });

                        var r = new Request(options);

                        console.log('request...');
                        return r.request('POST', '/authentication/oauth1/create', {}, "")
                            .then(function(result) {
                                console.log(result);
                            })
                            .then(function() {
                                $ionicLoading.hide();
                            })
                            ;
                    })
                        .then(function() {}, function(err) {
                            console.error(err);
                            console.error("" + err);
                            console.error(err.msg);
                            console.error(err.message);
                            $ionicLoading.hide();
                            throw err;
                        });

                } else {
                    $scope.errorMsg = 'GLIDERA_ERR';
                    $scope.errorDetails = qs.error_message.replace("+", " ");
                    $ionicLoading.hide();
                }
            } else {
                $state.go('app.wallet.summary');
            }
        }
    );
