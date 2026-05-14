-- Run once on MySQL/MariaDB if `custom_attributes` is missing (product editor custom fields).
ALTER TABLE produkt
  ADD COLUMN custom_attributes JSON NULL
  AFTER warranty;
