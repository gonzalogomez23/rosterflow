-- Fase 1: Database Schema for RosterFlow

-- Organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Managers
create table public.managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- Positions
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

-- Shifts (owned by positions)
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Shift Schedules (per day-of-week times and count)
create table public.shift_schedules (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  count int not null default 1 check (count >= 0),
  unique(shift_id, day_of_week)
);

-- Employees
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  max_hours_per_week numeric not null default 40,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Employee Positions (many-to-many)
create table public.employee_positions (
  employee_id uuid not null references public.employees(id) on delete cascade,
  position_id uuid not null references public.positions(id) on delete cascade,
  is_primary boolean not null default false,
  primary key (employee_id, position_id)
);

-- Employee Availability (weekly recurring)
create table public.employee_availability (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null
);

-- Rosters
create table public.rosters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roster Assignments (shift_id replaces shift_type_id + position_id)
create table public.roster_assignments (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid not null references public.rosters(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  date date not null
);

-- Helper function: get current user's organization ID
create or replace function public.get_user_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.managers where user_id = auth.uid()
$$;

-- Trigger: auto-create organization + manager on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org_id uuid;
begin
  insert into public.organizations (name)
  values (coalesce(new.raw_user_meta_data->>'organization_name', 'My Organization'))
  returning id into new_org_id;

  insert into public.managers (user_id, organization_id, full_name)
  values (new.id, new_org_id, coalesce(new.raw_user_meta_data->>'full_name', new.email));

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS Policies
alter table public.organizations enable row level security;
alter table public.managers enable row level security;
alter table public.positions enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_schedules enable row level security;
alter table public.employees enable row level security;
alter table public.employee_positions enable row level security;
alter table public.employee_availability enable row level security;
alter table public.rosters enable row level security;
alter table public.roster_assignments enable row level security;

-- Organizations: managers can read their own org
create policy "managers can view own org" on public.organizations
  for select using (id = public.get_user_org_id());

create policy "managers can update own org" on public.organizations
  for update using (id = public.get_user_org_id());

-- Managers
create policy "managers can view own record" on public.managers
  for select using (organization_id = public.get_user_org_id());

-- Positions
create policy "org isolation" on public.positions
  for all using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- Shifts
create policy "org isolation" on public.shifts
  for all using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- Shift Schedules
create policy "org isolation" on public.shift_schedules
  for all using (
    shift_id in (select id from public.shifts where organization_id = public.get_user_org_id())
  )
  with check (
    shift_id in (select id from public.shifts where organization_id = public.get_user_org_id())
  );

-- Employees
create policy "org isolation" on public.employees
  for all using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- Employee Positions
create policy "org isolation" on public.employee_positions
  for all using (
    employee_id in (select id from public.employees where organization_id = public.get_user_org_id())
  )
  with check (
    employee_id in (select id from public.employees where organization_id = public.get_user_org_id())
  );

-- Employee Availability
create policy "org isolation" on public.employee_availability
  for all using (
    employee_id in (select id from public.employees where organization_id = public.get_user_org_id())
  )
  with check (
    employee_id in (select id from public.employees where organization_id = public.get_user_org_id())
  );

-- Rosters
create policy "org isolation" on public.rosters
  for all using (organization_id = public.get_user_org_id())
  with check (organization_id = public.get_user_org_id());

-- Roster Assignments
create policy "org isolation" on public.roster_assignments
  for all using (
    roster_id in (select id from public.rosters where organization_id = public.get_user_org_id())
  )
  with check (
    roster_id in (select id from public.rosters where organization_id = public.get_user_org_id())
  );

-- Grant table-level permissions to authenticated users
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on function public.get_user_org_id() to authenticated;
