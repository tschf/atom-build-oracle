#!/bin/bash
# DEFINE EXIT CODES
INTERPRETER_NOT_FOUND=1


PKG_DIR=$1
SQL_INTERPRETER=$2

TMP_DIR=${PKG_DIR}/tmp
FIFO_PATH=${TMP_DIR}/sqlconsole
SPOOL_TO=${TMP_DIR}/spooledSql.txt
DEBUG_FILE=${TMP_DIR}/fifoStartup.log
DEBUG_ENABLED=N
INTERPRETER_PATH=$(which ${SQL_INTERPRETER})

function makeFifo {
    debug "Creating new FIFO at ${FIFO_PATH}"
    rm -f ${FIFO_PATH}
    mkdir -p ${TMP_DIR}
    mkfifo ${FIFO_PATH}
    setsid tail -f ${FIFO_PATH} | ${INTERPRETER_PATH} /nolog &
    debug "Process started with pid $!"
}

function debug {
    MSG=$1
    if [[ "${DEBUG_ENABLED}" -eq "Y" ]]; then
        echo ${MSG} >> ${DEBUG_FILE}
    fi

}

if [[ ! -x ${INTERPRETER_PATH} ]]; then
    echo "${SQL_INTERPRETER} either can not be found on the system, or is not executable" >&2
    exit ${INTERPRETER_NOT_FOUND}
fi

> ${DEBUG_FILE}
if [[ ! -x ${INTERPRETER_PATH} ]]; then
    echo "${SQL_INTERPRETER} either can not be found on the system, or is not executable" >&2
    exit 2
fi

if [[ -e ${FIFO_PATH} ]]; then
#The fifo already exists, so lets check if sqlcl is running behind it
#We can do so by spooling a file to see if it gets created
    rm -f ${SPOOL_TO}
    debug "FIFO already exists on the file system"
    echo "SPOOL ${SPOOL_TO}" > ${FIFO_PATH} &
    SPOOL_PID=$!

    MAX_SECS=2
    SECONDS_SINCE=0
    START_SPOOL=$(date -u +"%s")
    FILE_EXISTS=N

    while true; do

        if [[ -e ${SPOOL_TO} ]]; then
            FILE_EXISTS=Y
            debug "The requested spooled file (${SPOOL_TO}) was created. Nothing else to do"
            echo "SPOOL OFF" > ${FIFO_PATH} &
            break
        fi

        if [[ "${SECONDS_SINCE}" -ge "${MAX_SECS}" ]]; then
            debug "Didn't find requested spool file (${SPOOL_TO}) in ${SECONDS_SINCE} seconds. "
            kill ${SPOOL_PID} 2> /dev/null
            makeFifo
            break
        fi

        NOW_TIME=$(date -u +"%s")
        SECONDS_SINCE=$((NOW_TIME-START_SPOOL))
        sleep 0.1
    done

    rm -f ${SPOOL_TO}

else
#Doesn't exist. Make the fifo and start sql
    debug "The FIFO did not exist on the system as yet"
    makeFifo
fi
