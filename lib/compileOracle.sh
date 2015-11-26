#!/bin/bash
#compileOracle.sh: Simple script to run an SQL script in the arguments specified
#Build for the atom package `build-oracle` so Oracle developers are able to compile
#their scripts using the build system.
RECEIVED_ARGS=$#
EXPECTED_ARGS=8
HOST=$1
PORT=$2
SID=$3
USER=$4
PASSWORD=$5
COMPILE_SCRIPT=$6
SQL_CODE_FILE=$7
SQL_INTERPRETER=$8

function print_debug {
    echo "host: ${HOST}"
    echo "port: ${PORT}"
    echo "sid: ${SID}"
    echo "user: ${USER}"
    echo "password: ${PASSWORD}"
    echo "Compile script: ${COMPILE_SCRIPT}"
    echo "Compiling file: ${SQL_CODE_FILE}"
    echo "Interpreter path: ${SQL_INTERPRETER}"
}

if [[ "${RECEIVED_ARGS}" -ne ${EXPECTED_ARGS} ]]
then
    echo "Invalid number of args" >&2
    echo "Received ${RECEIVED_ARGS} expected ${EXPECTED_ARGS}" >&2
    exit 1
fi

#print_debug


INTERPRER_PATH=$(which ${SQL_INTERPRETER})

if [[ ! -x ${INTERPRER_PATH} ]]; then
    echo "${SQL_INTERPRETER} either can not be found on the system, or is not executable" >&2
    exit 2
fi

${SQL_INTERPRETER} ${USER}/${PASSWORD}@${HOST}:${PORT}/${SID} @${COMPILE_SCRIPT} ${SQL_CODE_FILE}
