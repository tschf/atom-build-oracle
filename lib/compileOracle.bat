@echo off
(echo Running
echo host: %1
echo port: %2
echo sid: %3
echo user: %4
REM echo password: %5
REM echo Compiling file: %6
REM echo Compile script: %7
echo sql interpreter: %8
)

SET SUCCESS_CODE=0
SET fileFound=-1
SET fileLoc=%8

REM if where finds the path specified, the exit code will be 0
REM this is useful when only specifying a basename
REM (for a simple name that will resolve in %path%)
where %fileLoc% > NUL 2>&1
SET whereCode=%ERRORLEVEL%
if %whereCode% equ %SUCCESS_CODE% set fileFound=%SUCCESS_CODE%

REM otherwise (full path) the location should return true with the exist function
if exist %fileLoc% set fileFound=%SUCCESS_CODE%

if %fileFound% neq %SUCCESS_CODE% (
    echo The specified SQL interpreter ^(%fileLoc%^) could not be found
    exit /B 1
)

%fileLoc% %4/%5@%1:%2/%3 @%6 %7
