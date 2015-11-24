'use strict';

function provideBuilder(){

    return {
        niceName: 'Oracle Build',

        isEligable: function(cwd) {
            return true;
        },

        settings: function(cwd) {

            //console.log(cwd);

            return [
                {
                    name: 'Oracle Build: default',
                    exec: '/home/trent/.atom/dev/packages/atom-build-oracle/lib/atom_compileOracle.sh',
                    args: ["example.com", "1521", "xe", "hr", "hr", "{FILE_ACTIVE}"],
                    sh: true
                }
            ];

        }
    };

}

module.exports.provideBuilder = provideBuilder;
