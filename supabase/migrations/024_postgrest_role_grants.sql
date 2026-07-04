-- Ensure PostgREST roles can access public schema objects created by migrations.
grant usage on schema public to postgres, anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
grant select on tables to anon;

alter default privileges in schema public
grant usage, select on sequences to authenticated, service_role;
