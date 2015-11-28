#!/bin/bash
# DEFINE EXIT CODES
SUCCESSFUL=0
INTERPRETER_NOT_FOUND=1
TIMEOUT=2

#Function declarations
function startFifodSql {
    CMD="tail -f ${FIFO_DEST} | ${SQL_INTERPRETER} /nolog"
    setsid /usr/share/atom/resources/app/apm/bin/node -e "var cp = require('child_process'); cp.exec('${CMD}');" &
    echo "process should have started?"
}

#Set up args
HOST=$1
PORT=$2
SID=$3
USER=$4
PASSWORD=$5
PKG_DIR=$6
SQL_CODE_FILE=$7
SQL_INTERPRETER=$8
RUN_SQL_BG=$9

#Set up constants
TRUE_VALUE=true
FALSE_VALUE=false
LIB_DIR=${PKG_DIR}/lib
TMP_DIR=${PKG_DIR}/tmp
COMPILE_SCRIPT=${LIB_DIR}/compile.sql
SPOOL_TO=${TMP_DIR}/spooledCompilation.txt
FIFO_DEST=${TMP_DIR}/sqlconsole

if [[ ! -e ${TMP_DIR} ]]; then
    echo "${TMP_DIR} does not exist; Creating"
    mkdir -p ${TMP_DIR}
fi

if [[ ${RUN_SQL_BG} = ${TRUE_VALUE} ]]; then

    #Replace values since we aren't calling the script in the traditional way.
    sed ${COMPILE_SCRIPT} \
    -e "s|&1|${USER}|" \
    -e "s|&2|${PASSWORD}|" \
    -e "s|&3|${HOST}|" \
    -e "s|&4|${PORT}|" \
    -e "s|&5|${SID}|" \
    -e "s|&6|${SQL_CODE_FILE}|" \
    -e "s|--SPOOL|SPOOL|" \
    -e "s|SPOOLTOPATH|${SPOOL_TO}|" \
    -e "s|--CONFIRMCOMPILATION|exec dbms_output.put_line('COMPILE_COMPLETE');|" > ${FIFO_DEST}

    MAX_TIME=10 #We should exit if it takes more than 10 seconds
    START_CHECK_TIME=$(date -u +"%s")
    SECONDS_SINCE=0
    #Wait for the above process to finish (or exceeds the max time)
    while true; do

        if [[ "${SECONDS_SINCE}" -ge "${MAX_TIME}" ]]; then
            echo "Script took longer than expected" >&2
            exit ${TIMEOUT}
        fi

        if [[ -e ${SPOOL_TO} ]] && grep -q "COMPILE_COMPLETE" ${SPOOL_TO}; then
            cat ${SPOOL_TO}
            rm -f ${SPOOL_TO}
            exit ${SUCCESSFUL}
        fi

    done

else
    echo "exit" | ${SQL_INTERPRETER} /nolog @${COMPILE_SCRIPT} ${USER} ${PASSWORD} ${HOST} ${PORT} ${SID} ${SQL_CODE_FILE}
    exit ${SUCCESSFUL}
fi
