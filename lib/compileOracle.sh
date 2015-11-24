#!/bin/bash

if [[ "$#" -ne 6 ]]
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
echo "Compiling file: $6"

sqlplus -S -L $4/$5@$1:$2/$3 << EOF

    set linesize 200
    set tab off
    set serveroutput on

    COLUMN MY_USER FORMAT A20
    COLUMN DB FORMAT A20
    COLUMN SID FORMAT A10
    COLUMN NOW FORMAT A35
    --Show the details of the connection for confirmation
    select
        user as MY_USER
      , ora_database_name as DB
      --, '$3' as SID
      , systimestamp as NOW
    from dual;

    @$6

    COLUMN MY_USER 	CLEAR
    COLUMN DB 	    CLEAR
    COLUMN SID 	    CLEAR
    COLUMN NOW 	    CLEAR

    show error

EOF
