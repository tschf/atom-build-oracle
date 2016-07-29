create or replace view v_my_view as
select 'Accent char is: ù.' my_name
from dual;

select *
from v_my_view;
