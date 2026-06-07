-- Add tees JSONB array to courses (replaces scalar tee_name/course_rating/slope_rating)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tees jsonb NOT NULL DEFAULT '[]';

-- Par corrections from confirmed GHIN tee data (Sept 2025)
-- Portstewart Strand: 71 (not 72); Portrush Dunluce: 72 (not 71 — 71 is Open setup only)
UPDATE courses SET par = 71 WHERE slug = 'portstewart';
UPDATE courses SET par = 72 WHERE slug = 'portrush';

-- Royal County Down · par 71
-- Source: visitor_information page. Red (79.4/151) omitted — women's tee.
UPDATE courses SET tees = '[
  {"name":"Blue",   "rating":75.9, "slope":145, "par":71, "yards":7206},
  {"name":"White",  "rating":74.8, "slope":136, "par":71, "yards":6925},
  {"name":"Yellow", "rating":73.5, "slope":134, "par":71, "yards":6651},
  {"name":"Green",  "rating":71.6, "slope":130, "par":71, "yards":6249}
]' WHERE slug='rcd';

-- Royal Portrush (Dunluce) · par 72
-- Black is the forward tee at Portrush.
UPDATE courses SET tees = '[
  {"name":"Blue",  "rating":76.2, "slope":140, "par":72},
  {"name":"White", "rating":72.4, "slope":131, "par":72},
  {"name":"Green", "rating":70.7, "slope":127, "par":72},
  {"name":"Black", "rating":68.8, "slope":123, "par":72}
]' WHERE slug='portrush';

-- Portstewart Strand · par 71
-- Temp tees (Black Temp 73.2/127, Blue Temp 71.5/124) excluded — winter/temp-green setup.
UPDATE courses SET tees = '[
  {"name":"Black", "rating":74.2, "slope":131, "par":71},
  {"name":"Blue",  "rating":72.6, "slope":127, "par":71},
  {"name":"White", "rating":69.5, "slope":117, "par":71}
]' WHERE slug='portstewart';

-- St Patrick's Links (Rosapenna) · par 71
UPDATE courses SET tees = '[
  {"name":"Sandstone", "rating":73.2, "slope":128, "par":71},
  {"name":"Slate",     "rating":71.0, "slope":125, "par":71},
  {"name":"Granite",   "rating":68.7, "slope":121, "par":71}
]' WHERE slug='stpats';

-- Old Tom Morris Links (Rosapenna) · par 71
UPDATE courses SET tees = '[
  {"name":"Black", "rating":73.1, "slope":126, "par":71},
  {"name":"Blue",  "rating":71.0, "slope":123, "par":71},
  {"name":"White", "rating":69.5, "slope":121, "par":71},
  {"name":"Red",   "rating":65.0, "slope":104, "par":71}
]' WHERE slug='otm';
