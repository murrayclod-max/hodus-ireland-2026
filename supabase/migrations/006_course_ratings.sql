-- Add tees JSONB array to courses (replaces scalar tee_name/course_rating/slope_rating)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tees jsonb NOT NULL DEFAULT '[]';

-- Seed all tee boxes for the 5 trip courses
UPDATE courses SET tees = '[
  {"name":"Championship","yards":7186,"rating":74.3,"slope":141},
  {"name":"Medal",       "yards":6604,"rating":71.7,"slope":133},
  {"name":"Scratch",     "yards":6152,"rating":69.5,"slope":126},
  {"name":"Red",         "yards":5579,"rating":72.3,"slope":130}
]' WHERE slug='rcd';

UPDATE courses SET tees = '[
  {"name":"Championship","yards":7381,"rating":76.0,"slope":133},
  {"name":"Medal",       "yards":6573,"rating":72.0,"slope":126},
  {"name":"Yellow",      "yards":6009,"rating":69.2,"slope":121},
  {"name":"Red",         "yards":5390,"rating":71.4,"slope":126}
]' WHERE slug='portrush';

UPDATE courses SET tees = '[
  {"name":"Championship","yards":7118,"rating":74.5,"slope":131},
  {"name":"Medal",       "yards":6543,"rating":71.5,"slope":124},
  {"name":"Yellow",      "yards":6020,"rating":69.0,"slope":119},
  {"name":"Red",         "yards":5366,"rating":71.0,"slope":123}
]' WHERE slug='portstewart';

UPDATE courses SET tees = '[
  {"name":"Championship","yards":6930,"rating":72.5,"slope":128},
  {"name":"Medal",       "yards":6400,"rating":70.0,"slope":122},
  {"name":"Yellow",      "yards":5900,"rating":67.8,"slope":116},
  {"name":"Red",         "yards":5200,"rating":69.5,"slope":121}
]' WHERE slug='stpats';

UPDATE courses SET tees = '[
  {"name":"Championship","yards":6915,"rating":71.5,"slope":125},
  {"name":"Medal",       "yards":6380,"rating":69.5,"slope":119},
  {"name":"Yellow",      "yards":5850,"rating":67.3,"slope":113},
  {"name":"Red",         "yards":5150,"rating":68.8,"slope":117}
]' WHERE slug='otm';
