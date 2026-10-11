-- Cloudinary delivery type: upload (public) vs authenticated (private)
ALTER TABLE `media_assets`
  ADD COLUMN `cloudinary_type` VARCHAR(20) NOT NULL DEFAULT 'upload' AFTER `resource_type`;
