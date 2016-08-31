set linesize 200

set serveroutput on
set verify off
set sqlblanklines on

COLUMN MY_USER FORMAT A20
COLUMN DB FORMAT A15
COLUMN NOW FORMAT A40

prompt Database connection information

--Show the details of the connection for confirmation
select user MY_USER, ora_database_name DB, systimestamp NOW from dual;

prompt
prompt Compiling script: &1
prompt 
@"&1"

COLUMN MY_USER 	CLEAR
COLUMN DB 	    CLEAR
COLUMN NOW 	    CLEAR

show error

exit
