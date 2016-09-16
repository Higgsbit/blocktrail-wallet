angular.module('blocktrail.wallet').factory(
    'glideraService',
    function(CONFIG, $log, $q, Wallet, settingsService) {
        var clientId = "9074010d6e573bd7b06645735ba315c8";
        var clientSecret = "02cc9562bd2049b6fadb88578bc4c723";
        var returnuri = "btccomwallet://glideraCallback";

        var createRequest = function(options, accessToken) {
            options = options || {};
            var headers = {};
            if (accessToken) {
                headers['Authorization'] = 'Bearer ' + accessToken;
            }

            options = _.defaults({}, (options || {}), {
                https: true,
                host: 'sandbox.glidera.io',
                endpoint: '/api/v1',
                params: {},
                headers: _.defaults({}, (options.headers || {}), headers),
                contentMd5: false
            });

            return new blocktrailSDK.Request(options);
        };

        var oauth2 = function() {
            var uuid = Math.ceil((new Date).getTime() / 1000);
            var scope = ['transact'].join(',');
            var qs = [
                'response_type=code',
                'client_id=' + clientId,
                'state=' + uuid,
                'scope=' + scope,
                'required_scope=' + scope,
                'login_hint=' + (settingsService.email || "").replace(/\+.*@/, "@"),
                'redirect_uri=' + returnuri + "/oauth2"
            ];

            var glideraUrl = "https://sandbox.glidera.io/oauth2/auth?" + qs.join("&");

            $log.debug('oauth2', glideraUrl);

            window.open(glideraUrl, '_system');
        };

        var handleOauthCallback = function(glideraCallback) {

            return $q.when(glideraCallback)
                .then(function(glideraCallback) {
                    var qs = parseQuery(glideraCallback);

                    $log.debug('qs? ', JSON.stringify(qs, null, 4));

                    if (!qs.code) {
                        throw new Error(qs.error_message.replace("+", " "));
                    }

                    var r = createRequest();

                    return r.request('POST', '/oauth/token', {}, {
                        grant_type: "authorization_code",
                        code: qs.code,
                        redirect_uri: returnuri + "/oauth2",
                        client_id: clientId,
                        client_secret: clientSecret
                    })
                        .then(function(result) {
                            $log.debug('oauthtoken', JSON.stringify(result, null, 4));

                            return settingsService.$isLoaded().then(function() {
                                // @TODO: encrypt with PIN
                                settingsService.glideraAccessToken = {
                                    accessToken: result.access_token,
                                    scope: result.scope
                                };

                                return settingsService.$store().then(function() {
                                    $log.debug('SAVED');
                                    return true;
                                });
                            });
                        })
                        ;
                })
                .then(function(result) { return result }, function(err) { $log.log(err); throw err; });
            ;
        }

        var userCanTransact = function() {
            return settingsService.$isLoaded().then(function() {
                $log.debug('glideraAccessToken', JSON.stringify(settingsService.glideraAccessToken, null, 4));

                if (!settingsService.glideraAccessToken) {
                    return false;
                }

                if (typeof settingsService.glideraAccessToken.userCanTransact !== "undefined") {
                    return settingsService.glideraAccessToken.userCanTransact;
                }

                return accessToken().then(function(accessToken) {
                    if (!accessToken) {
                        return false;
                    }

                    var r = createRequest(null, accessToken);

                    return r.request('GET', '/user/status ', {}, null)
                        .then(function(result) {
                            $log.debug('status', JSON.stringify(result, null, 4));

                            return settingsService.$isLoaded().then(function() {
                                // @TODO: encrypt with PIN
                                settingsService.glideraAccessToken.userCanTransact = result.userCanTransact;

                                return settingsService.$store().then(function() {
                                    return result.userCanTransact;
                                });
                            });
                        })
                        ;
                });
            })
                .then(function(userCanTransact) { return userCanTransact }, function(err) { $log.log(err); throw err; });
        };

        var accessToken = function() {
            return settingsService.$isLoaded().then(function() {
                $log.debug('glideraAccessToken', JSON.stringify(settingsService.glideraAccessToken, null, 4));

                return settingsService.glideraAccessToken ? settingsService.glideraAccessToken.accessToken : null;
            });
        };

        var buyPrices = function(qty, fiat) {
            return userCanTransact().then(function(userCanTransact) {
                if (!userCanTransact) {
                    throw new Error("User can't transact!");
                }

                return accessToken().then(function(accessToken) {
                    var r = createRequest(null, accessToken);
                    return r.request('POST', '/prices/buy', {}, {
                        qty: qty,
                        fiat: fiat
                    })
                        .then(function(result) {
                            $log.debug('buyPrices', JSON.stringify(result, null, 4));

                            return result;
                        })
                        ;
                });
            });
        };

        var buy = function(qty, priceUuid) {
            return userCanTransact().then(function(userCanTransact) {
                if (!userCanTransact) {
                    throw new Error("User can't transact!");
                }

                return accessToken().then(function(accessToken) {

                    return Wallet.getNewAddress().then(function(address) {
                        var r = createRequest(null, accessToken);
                        return r.request('POST', '/buy', {}, {
                            destinationAddress: address,
                            qty: qty,
                            priceUuid: priceUuid,
                            useCurrentPrice: false
                        })
                            .then(function(result) {
                                $log.debug('buy', JSON.stringify(result, null, 4));

                                return result;
                            })
                        ;
                    });
                });
            });
        };

        return {
            createRequest: createRequest,
            oauth2: oauth2,
            handleOauthCallback: handleOauthCallback,
            accessToken: accessToken,
            userCanTransact: userCanTransact,
            buyPrices: buyPrices,
            buy: buy
        };
    }
);
