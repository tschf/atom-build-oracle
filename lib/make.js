'use strict';

function getPackagePath(){
    var pkgManager = atom.packages;

    return pkgManager.resolvePackagePath('build-oracle');
}

function getConfig(path){
    delete require.cache[path];

    return require(path);
}

function provideBuilder(){

    var path = require('path');
    var fs = require('fs');


    return {
        niceName: 'Oracle Build',

        isEligable: function(cwd) {
            this.oracleBuildConfig = path.join(cwd, '.atom-build-oracle.json');
            return fs.existsSync(this.oracleBuildConfig);
        },

        settings: function(cwd) {

            this.settingsFetched = new Date();
            var pkgDir = getPackagePath();
            var parsedConfig = getConfig(this.oracleBuildConfig);
            var buildTargets = [];

            for (var i = 0; i < parsedConfig.length; i++){
                let currentTarget = parsedConfig[i];
                let thisConfig = {};

                thisConfig.name = 'Oracle Build::' + currentTarget.targetName;
                thisConfig.exec = pkgDir + '/lib/compileOracle.sh';
                thisConfig.args = [
                    currentTarget.host,
                    currentTarget.port.toString(),
                    currentTarget.sid,
                    currentTarget.user,
                    currentTarget.password,
                    pkgDir + '/lib/compile.sql',
                    "{FILE_ACTIVE}"
                ];
                thisConfig.sh = true;

                buildTargets.push(thisConfig);
            }

            return buildTargets;

        },
        on: function(evt, evtCallback){
            //As as 25.11.2015, `on` only provides the `refresh` evt
            if (evt !== "refresh"){
                return;
            }

            this.fsWatcher = fs.watch(this.oracleBuildConfig, () => {
                //After calling refreshTargets, the `refresh` event will be
                //immediately fired again, so we need to check for a delay (1 sec)
                if (new Date() - this.settingsFetched > 1000){
                    //calling `refreshTargets` in `atom-build/lib/build.js`
                    evtCallback();
                }
            });

        },
        off: function(){
            //Called before a new refresh, so the existing fileWatch can be switched off
            if (this.fsWatcher){
                this.fsWatcher.close();
                this.fsWatcher = undefined;
            }
        }
    };

}

module.exports.provideBuilder = provideBuilder;
