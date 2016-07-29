@echo off
REM Passed in arguments:
SET RECEIVED_ARGS=$#
SET EXPECTED_ARGS=8

SET HOST=%1
SET PORT=%2
SET SID=%3
SET USER=%4
SET PASSWORD=%5
SET PKG_DIR=%6
SET SQL_CODE_FILE=%7
SET SQL_INTERPRETER=%8
SET ATOM_NLS_LANG=%9

REM Multi word argument comes with double quotes. When concatenating, it ends up
REM with concatenated value outside the quotes
REM (e.g "C:\Users\trent\.atom\dev\packages\build-oracle"\lib\compileSimple.sql).
REM So, need to remove the quotes before concat and then re-add. Idea taken
REM from: http://stackoverflow.com/a/5181182/3476713.
REM I'm sure there's a better approach?

SET FULL_PATH_COMPILE_SCRIPT=%PKG_DIR:"=%
SET FULL_PATH_COMPILE_SCRIPT="%FULL_PATH_COMPILE_SCRIPT%\lib\compileSimple.sql"

if not defined NLS_LANG (
    set NLS_LANG=%ATOM_NLS_LANG:"=%
)

REM Display an output of the above variables for debugging
REM CALL :print_debug

REM used to test the return code of where to see if the file exists
SET SUCCESS_CODE=0

REM fileFound will be set to 0 if it exists. Set to anything else (-1) for now
SET fileFound=-1

REM if where finds the path specified, the exit code will be 0
REM this is useful when only specifying a basename
REM (for a simple name that will resolve in %path%)
where %SQL_INTERPRETER% > NUL 2>&1
SET whereCode=%ERRORLEVEL%
if %whereCode% equ %SUCCESS_CODE% set fileFound=%SUCCESS_CODE%

REM otherwise the location (absolute path) should return true with the exist function
if exist %SQL_INTERPRETER% set fileFound=%SUCCESS_CODE%

if %fileFound% neq %SUCCESS_CODE% (
    echo The specified SQL interpreter ^(%SQL_INTERPRETER%^) could not be found
    exit /B 1
)

%SQL_INTERPRETER% -L %USER%/%PASSWORD%@%HOST%:%PORT%/%SID% @%FULL_PATH_COMPILE_SCRIPT% %SQL_CODE_FILE%


exit /B 0

:print_debug
echo host: %HOST%
echo port: %PORT%
echo sid: %SID%
echo user: %USER%
echo password: %PASSWORD%
echo Compile script: %FULL_PATH_COMPILE_SCRIPT%
echo Compiling file: %SQL_CODE_FILE%
echo Interpreter path: %SQL_INTERPRETER%
exit /B 0
