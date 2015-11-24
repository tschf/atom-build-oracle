set linesize 200
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

@&1

COLUMN MY_USER 	CLEAR
COLUMN DB 	    CLEAR
COLUMN SID 	    CLEAR
COLUMN NOW 	    CLEAR

show error

exit
