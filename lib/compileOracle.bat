@echo off
REM Passed in arguments:
SET RECEIVED_ARGS=$#
SET EXPECTED_ARGS=8
SET HOST=%1
SET PORT=%2
SET SID=%3
SET USER=%4
SET PASSWORD=%5
SET COMPILE_SCRIPT=%6
SET SQL_CODE_FILE=%7
SET SQL_INTERPRETER=%8

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

%SQL_INTERPRETER% %USER%/%PASSWORD%@%HOST%:%PORT%/%SID% @%COMPILE_SCRIPT% %SQL_CODE_FILE%


exit /B 0

:print_debug
echo host: %HOST%
echo port: %PORT%
echo sid: %SID%
echo user: %USER%
echo password: %PASSWORD%
echo Compile script: %COMPILE_SCRIPT%
echo Compiling file: %SQL_CODE_FILE%
echo Interpreter path: %SQL_INTERPRETER%
exit /B 0
