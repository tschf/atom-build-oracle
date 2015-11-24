'use strict';

function getPackagePath(){
    var pkgManager = atom.packages;

    return pkgManager.resolvePackagePath('build-oracle');
}

function provideBuilder(){

    return {
        niceName: 'Oracle Build',

        isEligable: function(cwd) {
            return true;
        },

        settings: function(cwd) {

            var pkgDir = getPackagePath();

            return [
                {
                    name: 'Oracle Build: default',
                    exec: pkgDir + '/lib/atom_compileOracle.sh',
                    args: ["example.com", "1521", "xe", "hr", "hr", "{FILE_ACTIVE}"],
                    sh: true
                }
            ];

        }
    };

}

module.exports.provideBuilder = provideBuilder;
