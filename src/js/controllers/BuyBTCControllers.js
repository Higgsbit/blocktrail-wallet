angular.module('blocktrail.wallet')
    .controller('WalletBuyBTCCtrl', function($q, $scope, $cordovaDialogs, $ionicLoading, $translate, Wallet) {
        var bitcoin = blocktrailSDK.bitcoin;

        var encodeURIComponentBitIDURI = function(bitidUri) {
            return "bitid://" + encodeURIComponent(bitidUri.replace("bitid://", ""));
        };

        $scope.goGlideraBrowser = function() {
            var clientId = "9074010d6e573bd7b06645735ba315c8";
            var returnuri = "btccomwallet://glideraCallback";
            var glideraUrl = "https://sandbox.glidera.io/register?&client_id=" + clientId + "&redirect_uri=" + returnuri + "&response_type=code";

            console.log(encodeURI(glideraUrl));

            window.open(encodeURI(glideraUrl), '_system');
        };

        $scope.goGlideraBitID = function() {
            var hdHighBit = 0x80000000;
            var glideraHdPath = "m/" + (hdHighBit - 1) +  "'/0'";
            var clientId = "9074010d6e573bd7b06645735ba315c8";
            var returnuri = "urn:ietf:wg:oauth:2.0:oob"; // "btccomwallet://glideraCallback";

            // return $cordovaDialogs.prompt(
            //     $translate.instant('MSG_ENTER_PIN').sentenceCase(),
            //     $translate.instant('SETUP_GLIDERA').sentenceCase(),
            //         [$translate.instant('OK'), $translate.instant('CANCEL').sentenceCase()],
            //         "",
            //         true,   //isPassword
            //         "tel"   //input type (uses html5 style)
            //     )
            //     .then(function(dialogResult) {
            //         if (dialogResult.buttonIndex == 2) {
            //             return $q.reject('CANCELLED');
            //         }
            //         //decrypt password with the provided PIN
            //         $ionicLoading.show({template: "<div>{{ 'WORKING' | translate }}...</div><ion-spinner></ion-spinner>", hideOnStateChange: true});
            //
            //         return Wallet.unlock(dialogResult.input1).then(function(unlockData) {
            //             $ionicLoading.hide();
            //
            //             return unlockData;
            //         });
            //     })
            //
                return Wallet.unlock("0000")

                .then(function(wallet) {
                    var privKey = blocktrailSDK.Wallet.deriveByPath(wallet.primaryPrivateKey, glideraHdPath, "m/");
                    var address = privKey.getAddress().toBase58Check();

                    var bitidUri = "bitid://" + "sandbox.glidera.io/bitid/auth?x=" + Math.ceil((new Date).getTime() / 1000);
                    var bitidSig = bitcoin.Message.sign(privKey.privKey, bitidUri).toString('base64');


                    var qs = [
                        'client_id=' + clientId,
                        'redirect_uri=' + encodeURIComponent(returnuri),
                        'bitid_address=' + address,
                        'bitid_signature=' + encodeURIComponent(bitidSig),
                        'bitid_uri=' + encodeURIComponentBitIDURI(bitidUri)
                    ];

                    var glideraUrl = "https://sandbox.glidera.io/bitid/auth?" + qs.join("&");

                    console.log(glideraUrl);
                });
        };

        $scope.goGlideraBitID();
    }
);

angular.module('blocktrail.wallet')
    .controller('WalletBuyBTCGlideraCallbackCtrl', function($scope) {
        alert($scope.glideraCallback);
    }
);
