'use strict';

function getPackagePath(){
    var pkgManager = atom.packages;

    return pkgManager.resolvePackagePath('build-oracle');
}

function provideBuilder(){

    var path = require('path');
    var fs = require('fs');

    return {
        niceName: 'Oracle Build',

        isEligable: function(cwd) {
            console.log(cwd);
            return fs.existsSync(path.join(cwd, '.atom-build-oracle.json'));
        },

        settings: function(cwd) {
            var pkgDir = getPackagePath();
            var configFilePath = path.join(cwd, '.atom-build-oracle.json');
            var buildTargets = [];

            var parsedConfig = require(configFilePath);
            console.log(parsedConfig);
            for (var i = 0; i < parsedConfig.length; i++){
                let currentTarget = parsedConfig[i];
                let thisConfig = {};

                thisConfig.name = 'Oracle Build:: ' + currentTarget.targetName;
                thisConfig.exec = pkgDir + '/lib/compileOracle.sh';
                thisConfig.args = [
                    currentTarget.host,
                    currentTarget.port.toString(),
                    currentTarget.sid,
                    currentTarget.user,
                    currentTarget.password,
                    "{FILE_ACTIVE}",
                    pkgDir + '/lib/compile.sql'
                ];
                thisConfig.sh = true;

                buildTargets.push(thisConfig);
            }

            return buildTargets;

        }
    };

}

module.exports.provideBuilder = provideBuilder;
