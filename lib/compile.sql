set linesize 200
set serveroutput on
set verify off

COLUMN MY_USER FORMAT A20
COLUMN DB FORMAT A15
COLUMN NOW FORMAT A40

--Show the details of the connection for confirmation
    select
        user as MY_USER
      , ora_database_name as DB
      , systimestamp as NOW
    from dual;

@&1

COLUMN MY_USER 	CLEAR
COLUMN DB 	    CLEAR
COLUMN NOW 	    CLEAR

show error

exit
