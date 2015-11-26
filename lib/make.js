'use strict';

function getPackagePath(){
    var pkgManager = atom.packages;

    return pkgManager.resolvePackagePath('build-oracle');
}

function getFileJson(path){
    delete require.cache[path];

    return require(path);
}

function getPackageSetting(propertyName){
    var settingValue = atom.config.get('build-oracle.' + propertyName);

    return settingValue;
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
            var parsedConfig = getFileJson(this.oracleBuildConfig);
            var buildTargets = [];

            for (var i = 0; i < parsedConfig.length; i++){
                let currentTarget = parsedConfig[i];
                let thisConfig = {};
                const execExtension = /^win/.test(process.platform) ? '.bat' : '.sh'

                thisConfig.name = 'Oracle Build::' + currentTarget.targetName;
                thisConfig.exec = path.join(pkgDir, 'lib','compileOracle' + execExtension);
                thisConfig.args = [
                    currentTarget.host,
                    currentTarget.port.toString(),
                    currentTarget.sid,
                    currentTarget.user,
                    currentTarget.password,
                    path.join(pkgDir, 'lib', 'compile.sql'),
                    "{FILE_ACTIVE}",
                    getPackageSetting('sqlPath')
                ];
                thisConfig.sh = false;

                buildTargets.push(thisConfig);
            }

            return buildTargets;

        },
        on: function(evt, evtCallback){
            //After calling refreshTargets, the `refresh` event will be
            //immediately fired again, so we need to check for a
            //reasonable delay (1 sec)
            function isUserChange(lastFetched){
                var minTime = 1000;//1 second

                return (new Date() - minTime) > minTime;
            }
            //As as 25.11.2015, `on` only provides the `refresh` evt
            if (evt !== "refresh"){
                return;
            }

            this.fsWatcher = fs.watch(this.oracleBuildConfig, () => {
                if (isUserChange(this.settingsFetched)){
                    //calling `refreshTargets` in `atom-build/lib/build.js`
                    evtCallback();
                }
            });

            this.sqlPathObvserver = atom.config.observe('build-oracle.sqlPath', (val) => {
                //first call, assign the current setting value
                if (!(this.sqlPath)){
                    this.sqlPath = val;
                } else {
                    //only if its changed should we `refreshTargets`
                    if (this.sqlPath !== val){
                        this.sqlPath = val;
                        evtCallback();
                    }
                }
            });
        },

        off: function(){
            //Called before a new refresh, so the existing fileWatch can be switched off
            if (this.fsWatcher){
                this.fsWatcher.close();
                this.fsWatcher = undefined;
            }

            if (this.sqlPathObvserver){
                this.sqlPathObvserver.dispose();
                this.sqlPathObvserver = undefined;
            }
        }
    };

}

function config(){
    var oracleBuildConfig = {};

    oracleBuildConfig.sqlPath = {
        title: 'Path to SQL interpreter',
        type: 'string',
        default: 'sqlplus',
        description: 'Specify the path to SQL*Plus (or SQLcl). If its in your path, the basename is acceptable'
    };

    return oracleBuildConfig;
}

module.exports.provideBuilder = provideBuilder;
module.exports.config = config();
