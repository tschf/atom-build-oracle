create or replace view v_atom_build_view as
select 'Accent char is: ù.' simple_string
from dual;

select *
from v_atom_build_view;

drop view v_atom_build_view;
