#!/bin/bash
# DEFINE EXIT CODES
SUCCESSFUL=0
INTERPRETER_NOT_FOUND=1
TIMEOUT=2

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
COMPILE_SCRIPT_SIMPLE=${LIB_DIR}/compileSimple.sql
SPOOL_TO=${TMP_DIR}/spooledCompilation.txt
FIFO_DEST=${TMP_DIR}/sqlconsole

if [[ ! -e ${TMP_DIR} ]]; then
    echo "${TMP_DIR} does not exist; Creating"
    mkdir -p ${TMP_DIR}
fi

if [[ ${RUN_SQL_BG} = ${TRUE_VALUE} ]]; then

    #Re-run to make sure the console is available
    ${LIB_DIR}/backgroundRunner.sh ${PKG_DIR} ${SQL_INTERPRETER}

    if [[ $! -eq ${TIMEOUT} ]]; then
        echo "Unable to start ${SQL_INTERPRETER} in the background" >&2
        exit ${TIMEOUT}
    fi

    #Replace values since we aren't calling the script in the traditional way.
    sed -e "s|&1|${USER}|" \
    -e "s|&2|${PASSWORD}|" \
    -e "s|&3|${HOST}|" \
    -e "s|&4|${PORT}|" \
    -e "s|&5|${SID}|" \
    -e "s|&6|${SQL_CODE_FILE}|" \
    -e "s|--SPOOL|SPOOL|" \
    -e "s|SPOOLTOPATH|${SPOOL_TO}|" \
    -e "s|--CONFIRMCOMPILATION|exec dbms_output.put_line('COMPILE_COMPLETE');|" \
    ${COMPILE_SCRIPT} > ${FIFO_DEST}

    MAX_TIME=30 #We should exit if it takes more than 30 seconds
    START_CHECK_TIME=$(date -u +"%s")
    SECONDS_SINCE=0
    #Wait for the above process to finish (or exceeds the max time)
    while true; do

        if [[ "${SECONDS_SINCE}" -ge "${MAX_TIME}" ]]; then
            echo "Script took longer than expected" >&2
            cat ${SPOOL_TO}
            rm -f ${SPOOL_TO}
            exit ${TIMEOUT}
        fi

        if [[ -e ${SPOOL_TO} ]] && grep -q "COMPILE_COMPLETE" ${SPOOL_TO}; then
            cat ${SPOOL_TO}
            rm -f ${SPOOL_TO}
            exit ${SUCCESSFUL}
        fi
        sleep 0.1
        NOW_TIME=$(date -u +"%s")
        SECONDS_SINCE=$((NOW_TIME-START_CHECK_TIME))

    done

else
    ${SQL_INTERPRETER} ${USER}/${PASSWORD}@//${HOST}:${PORT}/${SID} @${COMPILE_SCRIPT_SIMPLE} \"${SQL_CODE_FILE}\"
    exit ${SUCCESSFUL}
fi
