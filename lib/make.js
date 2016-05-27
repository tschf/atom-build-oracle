'use babel';
'use strict';

import path from 'path';
import fs from 'fs';

export function provideBuilder(){

    return class OracleBuildConfig {

        constructor(cwd){
            this.cwd = cwd;
        }

        getNiceName(){
            return 'Oracle Build Config';
        }

        isEligible(){
            this.oracleBuildConfig = path.join(this.cwd, '.atom-build-oracle.json');

            return fs.existsSync(this.oracleBuildConfig);
        }

        settings(){
            this.settingsFetched = new Date();
            var pkgDir = this.getPackagePath();

            //start background SQL interpreter when loading the config
            //this will show if there are any errors at boot up/change of config
            if (this.getPackageSetting("backgroundInterpreter")){
                backgroundStarter();
            }

            var parsedConfig = this.getFileJson(this.oracleBuildConfig);
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
                    pkgDir,
                    "{FILE_ACTIVE}",
                    this.getPackageSetting('sqlPath'),
                    this.getPackageSetting('backgroundInterpreter').toString()
                ];
                thisConfig.sh = false;

                buildTargets.push(thisConfig);
            }

            return buildTargets;
        }

        on(evt, evtCallback){
            //As as 25.11.2015, `on` only provides the `refresh` evt
            if (evt !== "refresh"){
                return;
            }

            this.fsWatcher = fs.watch(this.oracleBuildConfig, () => {
                var minTime = 1000;//1 second

                //Make sure a reasonable time has passed before calling the
                //refresh callback again
                if (new Date() - this.settingsFetched > minTime){
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

            this.bgObserver = atom.config.observe('build-oracle.backgroundInterpreter', (val) => {
                //first call, assign the current setting value
                if (typeof this.backgroundInterpreter == "undefined"){
                    this.backgroundInterpreter = val;
                } else {
                    //only if its changed should we `refreshTargets`
                    if (this.backgroundInterpreter !== val){
                        this.backgroundInterpreter = val;
                        evtCallback();
                    }
                }
            });
        }

        off(){
            //Called before a new refresh, so the existing fileWatch can be switched off
            if (this.fsWatcher){
                this.fsWatcher.close();
                this.fsWatcher = undefined;
            }

            if (this.sqlPathObvserver){
                this.sqlPathObvserver.dispose();
                this.sqlPathObvserver = undefined;
            }

            if (this.bgObserver){
                this.bgObserver.dispose();
                this.bgObserver = undefined;
            }
        }

        //Helper functions
        getPluginName(){
            return 'build-oracle';
        }

        getPackagePath(){
            var pkgManager = atom.packages;

            return pkgManager.resolvePackagePath(this.getPluginName());
        }

        getPackageSetting(propertyName){
            var pluginName = this.getPluginName();
            var settingValue = atom.config.get(`${pluginName}.${propertyName}`);

            return settingValue;
        }

        getFileJson(path){
            delete require.cache[path];

            return require(path);
        }
    }

};

function config(){
    return {
        "sqlPath" : {
            title: 'Path to SQL interpreter',
            type: 'string',
            default: 'sqlplus',
            description: 'Specify the path to SQL*Plus (or SQLcl). If its in your path, the basename is acceptable',
            order: 1
        },

        "backgroundInterpreter" : {
            title: 'Run interpreter in background?',
            type: 'boolean',
            default: false,
            description: 'Should the SQL interpreter run in the background? (Experimental to reduce execution times with Java based SQLcl)',
            order: 2
        }
    };
}

module.exports.config = config();
