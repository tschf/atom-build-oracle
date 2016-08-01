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
            let sqlPath = this.getPackageSetting('sqlPath');
            let nlsLang = this.getPackageSetting('nlsLang');
            let dyldLibraryPath = this.getPackageSetting('dyldLibraryPath');

            //OS X (El Capitan) needs this env variable set in order to find
            //the libraries to run SQL*Plus, and there is a security measure
            //which prevents it being passed into Atom.
            if (dyldLibraryPath){
                process.env.DYLD_LIBRARY_PATH = dyldLibraryPath;
            }

            if (!process.env.NLS_LANG && nlsLang){
                process.env.NLS_LANG = nlsLang;
            }

            var parsedConfig = this.getFileJson(this.oracleBuildConfig);
            var buildTargets = [];

            for (var i = 0; i < parsedConfig.length; i++){
                let currentTarget = parsedConfig[i];

                let user = currentTarget.user;
                let pass = currentTarget.password;
                let host = currentTarget.host;
                let port = currentTarget.port.toString();
                let sid = currentTarget.sid;

                let thisConfig = {};
                let connectString = `${user}/${pass}@//${host}:${port}/${sid}`;

                thisConfig.name = 'Oracle Build::' + currentTarget.targetName;

                let compileScript = path.join(pkgDir, 'lib', 'compileSimple.sql');
                thisConfig.exec = sqlPath
                thisConfig.args = [
                  connectString,
                  '@' + compileScript,
                  '{FILE_ACTIVE}'
                ];
                thisConfig.sh = false;
                thisConfig.cwd = "{FILE_ACTIVE_PATH}";
                thisConfig.functionMatch = this.doMatch;

                buildTargets.push(thisConfig);
            }

            return buildTargets;
        }

        doMatch(buildOutput){

            const buildOutputLines = buildOutput.split(/\n/);
            const errors = [];

            for(let i = 0; i < buildOutputLines.length; i++){
                const currentLine = buildOutputLines[i];
                const oraErrorMatches = currentLine.match(/((PLS|ORA)-[\d]+:.+$)/g);
                const dyldErrorMatches = currentLine.match(/dyld: Library not loaded:/g)
                const currentFile = atom.workspace.getActivePaneItem().buffer.file.path;

                if (oraErrorMatches && oraErrorMatches.length > 0){
                    errors.push({
                        message: oraErrorMatches[0] + ' (Please review the build output for more detailed information)',
                        file: currentFile,
                        type: 'Error',
                        severity: 'error'
                    });
                } else if (dyldErrorMatches && dyldErrorMatches.length > 0){
                    errors.push({
                        message: 'DYLD_LIBRARY_PATH is not set. Try setting in the build-oracle settings.',
                        file: currentFile,
                        type: 'Error',
                        severity: 'error'
                    });
                }
            }

            return errors;
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

            this.sqlPathObserver = atom.config.observe('build-oracle.sqlPath', (val) => {
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

            this.nlsLangObserver = atom.config.observe('build-oracle.nlsLang', (val) => {
                //first call, assign the current setting value
                if (!(this.nlsLang)){
                    this.nlsLang = val;
                } else {
                    //only if its changed should we `refreshTargets`
                    if (this.nlsLang !== val){
                        this.nlsLang = val;
                        evtCallback();
                    }
                }
            });

            this.dyldLibraryPathObserver = atom.config.observe('build-oracle.dyldLibraryPath', (val) => {
                //first call, assign the current setting value
                if (!(this.dyldLibraryPath)){
                    this.dyldLibraryPath = val;
                } else {
                    //only if its changed should we `refreshTargets`
                    if (this.dyldLibraryPath !== val){
                        this.dyldLibraryPath = val;
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

            if (this.sqlPathObserver){
                this.sqlPathObserver.dispose();
                this.sqlPathObserver = undefined;
            }

            if (this.nlsLangObserver){
                this.nlsLangObserver.dispose();
                this.nlsLangObserver = undefined;
            }

            if (this.dyldLibraryPathObserver) {
                this.dyldLibraryPathObserver.dispose();
                this.dyldLibraryPathObserver = undefined;
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

function isWindows(){
    return /^win/.test(process.platform);
}

function isOsx(){
    return /^darwin$/.test(process.platform);
}

export function activate(){
    //Install package deps, see: https://github.com/steelbrain/package-deps
    require('atom-package-deps').install('build-oracle');
};

function config(){

    let buildConfig = {};
    let settingIndex = 0;

    buildConfig.sqlPath = {
        title: 'Path to SQL interpreter',
        type: 'string',
        default: 'sqlplus',
        description: 'Specify the path to SQL*Plus (or SQLcl). If its in your path, the basename is acceptable',
        order: ++settingIndex
    };

    buildConfig.nlsLang = {
        title: 'NLS_LANG',
        type: 'string',
        default: '.AL32UTF8',
        description: 'Specify the NLS_LANG to ensure the correct encoding is used. Format is: [NLS&#95;LANGUAGE]&#95;[NLS&#95;TERRITORY].[NLS&#95;CHARACTERSET].',
        order: ++settingIndex
    };

    if (isOsx()){
        buildConfig.dyldLibraryPath = {
          title: 'DYLD_LIBRARY_PATH',
          type: 'string',
          default: '',
          description: 'Specify the DYLD_LIBRARY_PATH so SQL*Plus can run properly',
          order: ++settingIndex
        }
    }

    return buildConfig;
}

module.exports.config = config();
