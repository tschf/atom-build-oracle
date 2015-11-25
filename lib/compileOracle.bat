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

%8 %4/%5@%1:%2/%3 @%6 %7
