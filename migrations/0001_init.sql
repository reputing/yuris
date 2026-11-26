-- The catalogue. A work is one thing you can open: a manga/doujin, a piece of art, a video.
-- source_type says where it came from:
--   creator   uploaded or submitted by the person who made it (held for review before it is public)
--   linkout   metadata only, from a documented public API; the page links to the original, nothing is hosted
--   licensed  hosted under an agreement with the rights holder
create table if not exists works (
  id          integer primary key autoincrement,
  title       text not null,
  kind        text not null default 'manga' check (kind in ('manga', 'art', 'video', 'other')),
  creator     text not null default '',
  description text not null default '',
  cover_url   text,
  source_type text not null check (source_type in ('creator', 'linkout', 'licensed')),
  source_id   text,                    -- the id at the source (unique per source), so re-ingesting is a no-op
  source_url  text,                    -- where to read/watch it
  rating      text,
  status      text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  yuri        integer not null default 0,   -- promoted to the front of search and listings
  note        text,                    -- why it is held or rejected (policy verdicts, reviewer notes)
  contact     text,                    -- how to reach a creator who submitted it
  created_at  integer not null default (unixepoch()),
  updated_at  integer not null default (unixepoch())
);
create unique index if not exists works_source_idx on works (source_type, source_id) where source_id is not null;
create index if not exists works_list_idx on works (status, yuri desc, created_at desc);

create table if not exists tags (
  id   integer primary key autoincrement,
  name text not null unique
);
create table if not exists work_tags (
  work_id integer not null references works(id) on delete cascade,
  tag_id  integer not null references tags(id) on delete cascade,
  primary key (work_id, tag_id)
);
create index if not exists work_tags_tag_idx on work_tags (tag_id);

-- Takedown requests and reports (DMCA, "this depicts a minor", anything else). A report about a minor takes
-- the work down immediately (see lib/catalog.ts report()).
create table if not exists reports (
  id         integer primary key autoincrement,
  work_id    integer references works(id) on delete set null,
  kind       text not null check (kind in ('dmca', 'minor', 'other')),
  email      text,
  details    text not null default '',
  status     text not null default 'open' check (status in ('open', 'done')),
  created_at integer not null default (unixepoch())
);
