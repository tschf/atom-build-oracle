#!/bin/bash

if [[ "$#" -ne 8 ]]
then
    echo "Invalid number of args" >&2
    echo "Received $# expected 8" >&2
    exit 1
fi

echo "Running"
echo "host: $1"
echo "port: $2"
echo "sid: $3"
echo "user: $4"
# echo "password: $5"
echo "Compiling file: $7"
#echo "Compile script: $7"
echo "Interpreter path: $8"

INTERPRER_PATH=$(which $8)

if [[ ! -x $INTERPRER_PATH ]]; then
    echo "$8 either can not be found on the system, or is not executable" >&2
    exit 2
fi

$8 $4/$5@$1:$2/$3 @$6 $7
