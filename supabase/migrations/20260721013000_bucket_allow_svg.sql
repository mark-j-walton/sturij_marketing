-- Allow SVG in the photos bucket. The demo seeder's placeholder images are
-- runtime-generated SVGs; the original bucket mime list (mirrored from
-- production) rejected them, which broke "Load demo data" with a 500.
-- Harmless on production: allowed_mime_types only gates uploads.
update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/svg+xml','video/webm','video/mp4','video/quicktime']
where id = 'photos';
