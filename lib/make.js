'use babel';
'use strict';

import path from 'path';
import fs from 'fs';
import tmp from 'tmp';

export function provideBuilder(){

    // Var to Keep track of the temporary file created when compiling against
    // an untitled file. Reason for this is that the `doMatch` function (which
    // returns a list of errors) doesn't have context to the build config.
    var _untitledFileDest;

    return class OracleBuildConfig {

        constructor(cwd){
            this.cwd = cwd;

            // Assume we have a saved file.
            // We need to keep track of this so that we can act in the pre and
            // post build phases to restore the configuration if necessary.
            this._savedFile = true;
        }

        getNiceName(){
            return 'Oracle Build Config';
        }

        isEligible(){
            this.oracleBuildConfig = path.join(this.cwd, '.atom-build-oracle.json');

            return fs.existsSync(this.oracleBuildConfig);
        }

        // preBuild: Before running the build, check out the active tab to see
        // if it is indeed a saved file or not. If it isn't, we want to save it
        // to a temporary file and point the build configuration to this new file
        preBuild(){

            // The only time the temp file will be opened is when there is an
            // issue in the compilation. Set an explanatory message that can
            // be added to the top of the untitled file contents when creating
            // the temporary file.
            const tmpFileWarning = [
                `-- This file was auto generated on ${new Date()} by`,
                `-- the \`build-oracle\` Atom plugin as the plugin requires a saved file to `,
                `-- compile and report any compilation errors. `,
                `-- `,
                `-- This file will be discarded upon exit from Atom; If you want to keep the `,
                `-- script you should save the file somewhere more practical.`
            ].join("\n");

            let fileBuffer = atom.workspace.getActivePaneItem();
            let isSavedFile = fileBuffer.buffer.file ? true : false;

            if (!isSavedFile){
                this._savedFile = false;
                // this._configInstance.savedFile = false;

                // the script being compiled is the last argument passed in to
                // the execute build command.
                const SQL_SCRIPT_INDEX = this.args.length-1;

                let untitledFile = tmp.fileSync({"postfix": ".sql"});
                _untitledFileDest = untitledFile.name;

                fs.writeFileSync(untitledFile.fd, `${tmpFileWarning}\n\n${fileBuffer.buffer.cachedText}`);

                // Set the build configuration to point to the created temporary file.
                this.args[SQL_SCRIPT_INDEX] = untitledFile.name;
                delete this.cwd;
            }
        }

        // postBuild: After the build has completed, we want to restore the
        // build configuration, to it's original state (which by default, compiles
        // the currently active file and the current working directory to the
        // path of the file).
        postBuild(buildOutcome, stdOut, stdErr){

            // If we operated on an untitled file, we need to restore
            // the configuration
            if (!this._savedFile) {
                // the script being compiled is the last argument passed in to
                // the execute build command.
                const SQL_SCRIPT_INDEX = this.args.length-1;

                this._savedFile = true;
                this.args[SQL_SCRIPT_INDEX] = '{FILE_ACTIVE}';
                this.cwd = '{FILE_ACTIVE_PATH}';
                _untitledFileDest = undefined;
            }

        }

        settings(){
            this.settingsFetched = new Date();
            var pkgDir = this.getPackagePath();
            let sqlPath = this.getPackageSetting('sqlPath');
            let nlsLang = this.getPackageSetting('nlsLang');
            let dyldLibraryPath = this.getPackageSetting('dyldLibraryPath');
            let enforceUtf8 = isWindows() ? this.getPackageSetting('enforceUtf8') : false;

            //OS X (El Capitan) needs this env variable set in order to find
            //the libraries to run SQL*Plus, and there is a security measure
            //which prevents it being passed into Atom.
            if (dyldLibraryPath){
                process.env.DYLD_LIBRARY_PATH = dyldLibraryPath;
            }

            if (!process.env.NLS_LANG && nlsLang){
                process.env.NLS_LANG = nlsLang;
            }

            //encforceUtf8: workaround for Windows is to set an environment variable
            //that the JVM will pick up so that UTF-8 encodings will work.
            //Only relevant for Windows.
            //See: http://stackoverflow.com/questions/361975/setting-the-default-java-character-encoding
            //https://github.com/tschf/atom-build-oracle/issues/29
            if (enforceUtf8){
                let encodingString = '-Dfile.encoding=UTF-8 ';
                if (process.env.JAVA_OPTS) {
                    encodingString += process.env.JAVA_OPTS;
                }

                process.env.JAVA_OPTS = encodingString;
            }

            var parsedConfig = this.getFileJson(this.oracleBuildConfig);
            var buildTargets = [];

            for (var i = 0; i < parsedConfig.length; i++){
                let currentTarget = parsedConfig[i];

                let user = currentTarget.user;
                let pass = currentTarget.password;
                let host = currentTarget.host;
                let port = currentTarget.port ? currentTarget.port.toString() : "1521";
                let sid = currentTarget.sid;
                let connectString = currentTarget.connectString;
                let thisConfig = {};

                if (!connectString){
                    connectString = `${user}/${pass}@//${host}:${port}/${sid}`;
                }
                thisConfig.name = 'Oracle Build::' + currentTarget.targetName;

                let compileScript = path.join(pkgDir, 'lib', 'compileSimple.sql');
                thisConfig.exec = sqlPath
                thisConfig.args = [
                  "-L",
                  connectString,
                  '@' + compileScript,
                  '{FILE_ACTIVE}'
                ];
                thisConfig.sh = false;
                thisConfig.cwd = "{FILE_ACTIVE_PATH}";
                thisConfig.functionMatch = this.doMatch;
                thisConfig.preBuild = this.preBuild;
                thisConfig.postBuild = this.postBuild;

                // custom attributes not a part of the provider
                // _savedFile: keep track if we are compiling on a saved file
                // or not. This will allow us to act in the pre and post build
                // changing the build config.
                thisConfig._savedFile = true;

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
                const currentFile = _untitledFileDest ? _untitledFileDest : atom.workspace.getActivePaneItem().buffer.file.path;

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

            this.enforceUtf8Observer = atom.config.observe('build-oracle.enforceUtf8', (val) => {
                //first call assign the current settings val
                if (!(this.hasOwnProperty('enforceUtf8'))){
                    this.enforceUtf8 = val;
                } else {
                    //only if it changes should we `refreshTargets`
                    if (this.enforceUtf8 !== val) {
                        this.enforceUtf8 = val;
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

            if (this.enforceUtf8Observer) {
                this.enforceUtf8Observer.dispose();
                this.enforceUtf8Observer = undefined;
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

    //SQLcl on Windows doesn't seem to support UTF-8 encoding. Need a work around
    //in order to enable it.
    if (isWindows()){
        buildConfig.enforceUtf8 = {
            title: 'Enforce UTF-8 encoding',
            type: 'boolean',
            default: true,
            description: 'Enable UTF-8 encoding in the JVM (Used for SQLcl on Windows. Only works with sql.bat)',
            order: ++settingIndex
        }
    }

    return buildConfig;
}

module.exports.config = config();
