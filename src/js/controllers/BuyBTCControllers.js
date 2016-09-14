angular.module('blocktrail.wallet')
    .controller('WalletBuyBTCCtrl', function($q, $scope, $cordovaDialogs, $ionicLoading, $translate, Wallet) {
        $scope.goGlidera = function() {
            var clientId = "9074010d6e573bd7b06645735ba315c8";
            var returnuri = "btccomwallet://glideraCallback";
            var glideraUrl = "https://sandbox.glidera.io/register?&client_id=" + clientId + "&redirect_uri=" + returnuri + "&response_type=code";

            console.log(encodeURI(glideraUrl));

            window.open(encodeURI(glideraUrl), '_system');
        };

        $scope.goGlideraBitID = function() {
            var clientId = "9074010d6e573bd7b06645735ba315c8";
            var returnuri = "btccomwallet://glideraCallback";
            var glideraUrl = "https://sandbox.glidera.io/register?&client_id=" + clientId + "&redirect_uri=" + returnuri + "&response_type=code";

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
                        $ionicLoading.hide();

                        return unlockData;
                    });
                })
                .then(function(wallet) {
                    return wallet.getNewAddress().then(function(address) {
                        alert(address);
                    });
                });
        };
    }
);

angular.module('blocktrail.wallet')
    .controller('WalletBuyBTCGlideraCallbackCtrl', function($scope) {
        alert($scope.glideraCallback);
    }
);
