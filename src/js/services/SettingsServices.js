angular.module('blocktrail.wallet').service(
    'settingsService',
    function($q, storageService, sdkService, $log, $window) {

    var defaultBtcPrecision = $window.innerWidth <= 375 ? 4 : 8;
    var defaults = {
        displayName:  null,
        username:  '',
        email:  null,
        language: null,
        timezone:  "GMT+1",
        localCurrency:  "EUR",
        profilePic:  null,
        profileSynced: true,
        profilePosX:  50,
        profilePosY:  50,

        showRebrandMessage: true,

        glideraRequest: null,
        glideraAccessToken: null,

        buyBTCRegion: null,

        phoneNumber: null,
        phoneNationalNumber: null,
        phoneRegionCode: null,
        phoneHash: null,
        phoneVerified: false,
        enableContacts: true,       //contacts access and syncing. default to true for previous installs
        contactsLastSync: null,
        contactsWebSync: true,      //enable syncing contacts to web wallet

        backupSaved: false,
        backupSkipped: false,
        setupStarted: false,
        setupComplete: false,
        installTracked: false,

        //display options
        btcPrecision: defaultBtcPrecision,        //show 8 decimals by default, 4 on smaller screens
        vibrateOnTx: true,

        enablePolling: true,    //dev setting - disables auto polling for transactions
        useTestnet: false,      //dev setting - enables testnet for SDK

        permissionUsageData: true,      //permission to send anonymous usage data
        permissionCamera: false,        //iOS camera access
        permissionPhotos: false,        //iOS photo access
        permissionContacts: false,      //iOS contacts access
        permissionNotifications: false  //push notification allowed
    };
    angular.extend(this, defaults);

    var storage = storageService.db('settings');

    this._id = "user_settings";

    this._$isLoaded = null;
    /**
     * returns a promise to get the data, does not force update
     * @returns {null|*}
     */
    this.$isLoaded = function() {
        if (!this._$isLoaded) {
            this._$isLoaded = this.$load().then(
                function(r) { return true; },
                function(e) { if (e.status === 404) { return true; } else { $log.error(e); this._$isLoaded = null; } }
            );
        }

        return this._$isLoaded;
    };

    /**
     * load the data from the database
     * @returns {*}
     */
    this.$load = function() {
        var self = this;

        return storage.get('user_settings')
            .then(
                function(doc) {
                    return angular.extend(self, doc);
                },
                function() {
                    return angular.extend(self, defaults);
                }
            )
        ;
    };

    /**
     * update database copy of the data
     * @returns {*}     promise
     */
    this.$store = function() {
        var self = this;

        return storage.get('user_settings')
            .then(
                function(doc) { return doc; },
                function() { return {_id: "user_settings"}; }
            )
            .then(function(doc) {
                //update each of the values as defined in the defaults array
                angular.forEach(defaults, function(value, key) {
                    doc[key] = self[key];
                });

                return storage.put(doc).then(function() {
                    return doc;
                });
            })
        ;
    };

    /**
     * update server copy of profile data, and store in settings the success/failure of syncing
     * @returns {*}     promise
     */
    this.$syncProfileUp = function() {
        var self = this;
        return $q.when(sdkService.sdk())
            .then(function(sdk) {
                var profileData = {
                    profilePic: self.profilePic
                };
                return sdk.syncProfile(profileData).then(function(result) {
                    //profile synced successfully
                    return $q.when(self.profileSynced = true);
                }, function(err) {
                    //profile not synced
                    return $q.when(self.profileSynced = false);
                });
            })
            .then(function(result) {
                return storage.get('user_settings').then(function(doc) {
                    doc.profileSynced = self.profileSynced;
                    $log.debug('syncing profile');
                    return storage.put(doc).then(function() {
                        $log.debug('profile synced');
                        return doc;
                    });
                });
            });
    };

    /**
     * update local copy of profile data from server
     * @returns {*}     promise
     */
    this.$syncProfileDown = function() {
        var self = this;
        return $q.when(sdkService.sdk())
            .then(function(sdk) {
                return sdk.getProfile();
            })
            .then(function(result) {
                return storage.get('user_settings').then(function(doc) {
                    //store profile data
                    doc.profilePic = result.profilePic && ("data:image/jpeg;base64, " + result.profilePic) || null;
                    return $q.when(storage.put(doc)).then(function() {
                        //update service attrs
                        self.profilePic = doc.profilePic;
                        return doc;
                    });
                });
            });
    };

    this.$syncSettingsUp = function() {
        var self = this;

        return $q.when(sdkService.sdk())
            .then(function(sdk) {
                var settingsData = {
                    localCurrency: self.localCurrency,
                    // language: self.language,
                    username: self.username,
                    email: self.email,
                    glideraAccessToken: self.glideraAccessToken,
                    buyBTCRegion: self.buyBTCRegion
                };

                return sdk.syncSettings(settingsData);
            })
        ;
    };

    this.$syncSettingsDown = function() {
        var self = this;
        return $q.when(sdkService.sdk())
            .then(function(sdk) {
                return sdk.getSettings();
            })
            .then(function(result) {
                return self.$isLoaded().then(function() {
                    // self.language = result.language !== null ? result.language : self.language; // not until we support language switching
                    self.localCurrency = result.localCurrency !== null ? result.localCurrency : self.localCurrency;
                    self.username = result.username;
                    self.email = result.email;
                    self.glideraAccessToken = result.glideraAccessToken;
                    self.buyBTCRegion = result.buyBTCRegion;

                    return self.$store();
                });
            })
        ;
    };

});
