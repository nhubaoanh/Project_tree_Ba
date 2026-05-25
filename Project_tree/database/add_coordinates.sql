-- Add coordinates fields to thanhvien table for storing node positions in family tree
ALTER TABLE `thanhvien` 
ADD COLUMN `toaDoX` FLOAT DEFAULT NULL COMMENT 'X coordinate for family tree rendering',
ADD COLUMN `toaDoY` FLOAT DEFAULT NULL COMMENT 'Y coordinate for family tree rendering',
ADD COLUMN `updatedCoordinates` DATETIME DEFAULT NULL COMMENT 'Last time coordinates were updated';

-- Create index for faster lookups when loading tree coordinates
CREATE INDEX `idx_toadoxy` ON `thanhvien` (`dongHoId`, `toaDoX`, `toaDoY`);
