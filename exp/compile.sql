set linesize 200

conn &1/&2@&3:&4/&5

set serveroutput on
set verify off

COLUMN MY_USER FORMAT A20
COLUMN DB FORMAT A15
COLUMN NOW FORMAT A40

--SPOOL SPOOLTOPATH

--Show the details of the connection for confirmation
select user MY_USER, ora_database_name DB, systimestamp NOW from dual;

@"&6"

COLUMN MY_USER 	CLEAR
COLUMN DB 	    CLEAR
COLUMN NOW 	    CLEAR

show error

--CONFIRMCOMPILATION

--SPOOL OFF
disconnect
