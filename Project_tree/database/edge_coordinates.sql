-- Table for storing edge coordinates in family tree
CREATE TABLE IF NOT EXISTS `edge_coordinates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dongHoId` varchar(50) NOT NULL COMMENT 'Dòng họ ID',
  `edgeId` varchar(100) NOT NULL COMMENT 'Edge identifier (e.g., parent-1-2, spouse-1-2)',
  `bendX` float DEFAULT NULL COMMENT 'Bend point X coordinate',
  `bendY` float DEFAULT NULL COMMENT 'Bend point Y coordinate',
  `dx` float DEFAULT NULL COMMENT 'Delta X for edge positioning',
  `dy` float DEFAULT NULL COMMENT 'Delta Y for edge positioning',
  `cp1x` float DEFAULT NULL COMMENT 'Control point 1 X',
  `cp1y` float DEFAULT NULL COMMENT 'Control point 1 Y',
  `cp2x` float DEFAULT NULL COMMENT 'Control point 2 X',
  `cp2y` float DEFAULT NULL COMMENT 'Control point 2 Y',
  `active_flag` tinyint DEFAULT 1,
  `lu_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lu_user_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_edge_dongho` (`dongHoId`, `edgeId`),
  KEY `idx_dongho` (`dongHoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lưu tọa độ các đường nối trong cây gia phả';