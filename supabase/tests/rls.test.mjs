// Applies supabase/migrations to an in-memory Postgres and checks the
// row-level security and booking rules. Run with `npm run test:db`.
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { readFileSync, readdirSync } from "fs";

const migrationsDir = new URL("../migrations/", import.meta.url);
const baseline = readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(new URL(file, migrationsDir), "utf8"))
  .join("\n");

// Minimal stand-ins for what Supabase provides.
const supabaseStub = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema extensions;
create schema auth;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema storage to anon, authenticated, service_role;
alter table storage.objects enable row level security;
grant all on storage.objects to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
`;

const db = new PGlite({ extensions: { btree_gist } });
await db.exec(supabaseStub);
await db.exec(baseline);
console.log("baseline applied");

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
let failures = 0;

async function as(role, uid, fn) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false); set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}
function check(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}
async function rejects(fn) {
  try {
    await fn();
    return null;
  } catch (e) {
    return e.message;
  }
}

// Seed as service role: two salons, A live and B draft.
await db.exec(`
insert into auth.users values ('${A}', 'a@example.com'), ('${B}', 'b@example.com');
insert into public.businesses (id, owner_id, name, slug, status) values
  ('10000000-0000-0000-0000-00000000000a', '${A}', 'Salon A', 'salon-a', 'live'),
  ('10000000-0000-0000-0000-00000000000b', '${B}', 'Salon B', 'salon-b', 'draft');
insert into public.business_billing (business_id) values
  ('10000000-0000-0000-0000-00000000000a'), ('10000000-0000-0000-0000-00000000000b');
insert into public.services (id, business_id, name, duration_minutes, price_cents, is_visible) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Cut', 60, 4500, true),
  ('20000000-0000-0000-0000-0000000000a2', '10000000-0000-0000-0000-00000000000a', 'Secret', 30, 100, false),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'B cut', 60, 4000, true);
insert into public.staff (id, business_id, name) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Ama'),
  ('30000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Bea');
insert into public.clients (id, business_id, name, email) values
  ('40000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Client A', 'c@a.com');
insert into public.appointments (business_id, client_id, service_id, staff_id, service_name, starts_at, ends_at) values
  ('10000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
   '30000000-0000-0000-0000-00000000000a', 'Cut', '2026-11-01 10:00+00', '2026-11-01 11:00+00');
`);

// Anonymous visitors
await as("anon", null, async () => {
  const b = await db.query("select slug from public.businesses order by slug");
  check("anon sees only live businesses", b.rows.map((r) => r.slug).join() === "salon-a", b.rows.map((r) => r.slug).join());
  const s = await db.query("select name from public.services order by name");
  check("anon sees only visible services of live businesses", s.rows.map((r) => r.name).join() === "Cut", s.rows.map((r) => r.name).join());
  check("anon cannot read billing", Boolean(await rejects(() => db.query("select * from public.business_billing"))));
  check("anon cannot read clients", Boolean(await rejects(() => db.query("select * from public.clients"))));
  check("anon cannot read appointments", Boolean(await rejects(() => db.query("select * from public.appointments"))));
  check("anon cannot insert enquiries", Boolean(await rejects(() => db.query(
    "insert into public.enquiries (business_id, name, message) values ('10000000-0000-0000-0000-00000000000a','x','hi')"))));
  check("anon cannot update a business", Boolean(await rejects(() => db.query("update public.businesses set name = 'x'"))));
});

// Owner B (draft salon)
await as("authenticated", B, async () => {
  const b = await db.query("select slug from public.businesses order by slug");
  check("owner B sees live A and own draft B", b.rows.map((r) => r.slug).join() === "salon-a,salon-b", b.rows.map((r) => r.slug).join());
  const billing = await db.query("select business_id from public.business_billing");
  check("owner B reads only own billing", billing.rows.length === 1 && billing.rows[0].business_id.endsWith("b"));
  const clients = await db.query("select * from public.clients");
  check("owner B cannot see A's clients", clients.rows.length === 0);
  const appts = await db.query("select * from public.appointments");
  check("owner B cannot see A's appointments", appts.rows.length === 0);
  const upd = await db.query("update public.businesses set name = 'Hacked' where slug = 'salon-a'");
  check("owner B cannot update A", upd.affectedRows === 0);
  const ins = await rejects(() => db.query(
    "insert into public.services (business_id, name, duration_minutes) values ('10000000-0000-0000-0000-00000000000a', 'x', 30)"));
  check("owner B cannot add services to A", Boolean(ins));
  const mine = await db.query("update public.businesses set name = 'Salon B2', content = '{\"hero\":{}}' where slug = 'salon-b'");
  check("owner B can update own name and content", mine.affectedRows === 1);
  check("owner B cannot change own slug", Boolean(await rejects(() => db.query("update public.businesses set slug = 'new' where slug = 'salon-b'"))));
  check("owner B cannot verify own domain", Boolean(await rejects(() => db.query("update public.businesses set custom_domain_verified = true where slug = 'salon-b'"))));
  check("owner B cannot write billing", Boolean(await rejects(() => db.query("update public.business_billing set subscription_status = 'active'"))));
  check("owner B cannot create a business directly", Boolean(await rejects(() => db.query(
    `insert into public.businesses (owner_id, name, slug) values ('${B}', 'Free', 'free-site')`))));
  const st = await rejects(() => db.query(
    "insert into public.staff_services (business_id, staff_id, service_id) values ('10000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000a')"));
  check("cannot link own staff to another salon's service", Boolean(st));
  check("owner B cannot upload into A's media folder", Boolean(await rejects(() => db.query(
    "insert into storage.objects (bucket_id, name) values ('site-media', '10000000-0000-0000-0000-00000000000a/x.jpg')"))));
  const okUpload = await db.query(
    "insert into storage.objects (bucket_id, name) values ('site-media', '10000000-0000-0000-0000-00000000000b/x.jpg')");
  check("owner B can upload into own media folder", okUpload.affectedRows === 1);
});

// Owner A: booking rules
await as("authenticated", A, async () => {
  const s = await db.query("select name from public.services order by name");
  check("owner A sees own hidden services", s.rows.map((r) => r.name).join() === "Cut,Secret", s.rows.map((r) => r.name).join());
  const overlap = await rejects(() => db.query(`insert into public.appointments (business_id, staff_id, service_name, starts_at, ends_at)
    values ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'Cut', '2026-11-01 10:30+00', '2026-11-01 11:30+00')`));
  check("double booking the same stylist is rejected", Boolean(overlap), overlap ?? "");
  const backToBack = await db.query(`insert into public.appointments (business_id, staff_id, service_name, starts_at, ends_at)
    values ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'Cut', '2026-11-01 11:00+00', '2026-11-01 12:00+00')`);
  check("back-to-back appointments are allowed", backToBack.affectedRows === 1);
  await db.query(`update public.appointments set status = 'cancelled' where starts_at = '2026-11-01 10:00+00'`);
  const rebook = await db.query(`insert into public.appointments (business_id, staff_id, service_name, starts_at, ends_at)
    values ('10000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', 'Cut', '2026-11-01 10:00+00', '2026-11-01 11:00+00')`);
  check("a cancelled slot can be rebooked", rebook.affectedRows === 1);
  await db.query("delete from public.services where name = 'Cut'");
  const kept = await db.query("select count(*)::int as n, count(service_id)::int as linked from public.appointments");
  check("deleting a service keeps appointments and clears the link", kept.rows[0].n === 3 && kept.rows[0].linked === 0, JSON.stringify(kept.rows[0]));
  const cat = await db.query("insert into public.service_categories (business_id, name) values ('10000000-0000-0000-0000-00000000000a', 'Colour') returning id");
  await db.query(`insert into public.services (business_id, category_id, name, duration_minutes) values ('10000000-0000-0000-0000-00000000000a', '${cat.rows[0].id}', 'Balayage', 180)`);
  await db.query(`delete from public.service_categories where id = '${cat.rows[0].id}'`);
  const svc = await db.query("select category_id from public.services where name = 'Balayage'");
  check("deleting a category keeps its services, uncategorised", svc.rows[0].category_id === null);
});

const badSlug = await rejects(() => db.query(`insert into public.businesses (owner_id, name, slug) values ('${A}', 'X', 'dashboard')`));
check("reserved slugs are rejected", Boolean(badSlug));

console.log(failures ? `\n${failures} FAILED` : "\nall checks passed");
process.exit(failures ? 1 : 0);
