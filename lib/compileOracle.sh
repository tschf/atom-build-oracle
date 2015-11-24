#!/bin/bash

if [[ "$#" -ne 7 ]]
then
    echo "Invalid number of args"
    echo "Received $# expected 6"
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

sqlplus $4/$5@$1:$2/$3 @$6 $7
