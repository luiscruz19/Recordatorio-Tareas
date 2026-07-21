-- Migración: dos franjas de recordatorio (planificación / cierre)
-- =================================================================
-- En desarrollo el schema se sincroniza solo (sequelize.sync alter:true).
-- En PRODUCCIÓN el sync corre con alter:false (no modifica tablas existentes),
-- por lo que estas columnas hay que agregarlas a mano una única vez.
--
-- Uso (idempotente, se puede correr más de una vez sin romper):
--   mysql -u <user> -p <db> < 2026-07-21-dual-reminder-windows.sql
--
-- Ajustá @db si tu base no se llama así.

SET @db := DATABASE();

-- Helper: agrega una columna solo si no existe.
DROP PROCEDURE IF EXISTS __add_col;
DELIMITER //
CREATE PROCEDURE __add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl AND COLUMN_NAME = col
    ) THEN
        SET @sql := CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
        PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ---- Recordatorio de PLANIFICACIÓN (mañana) ----
CALL __add_col('reminder_settings', 'plan_enabled',                 "`plan_enabled` TINYINT(1) NOT NULL DEFAULT 1");
CALL __add_col('reminder_settings', 'plan_window_start',            "`plan_window_start` TIME NOT NULL DEFAULT '09:00:00'");
CALL __add_col('reminder_settings', 'plan_window_end',              "`plan_window_end` TIME NOT NULL DEFAULT '12:00:00'");
CALL __add_col('reminder_settings', 'plan_interval_minutes',        "`plan_interval_minutes` INT NOT NULL DEFAULT 30");
CALL __add_col('reminder_settings', 'plan_interval_loaded_minutes', "`plan_interval_loaded_minutes` INT NOT NULL DEFAULT 90");

-- ---- Recordatorio de CIERRE (tarde) ----
CALL __add_col('reminder_settings', 'close_enabled',        "`close_enabled` TINYINT(1) NOT NULL DEFAULT 1");
CALL __add_col('reminder_settings', 'close_window_start',   "`close_window_start` TIME NOT NULL DEFAULT '18:00:00'");
CALL __add_col('reminder_settings', 'close_window_end',     "`close_window_end` TIME NOT NULL DEFAULT '20:00:00'");
CALL __add_col('reminder_settings', 'close_interval_minutes', "`close_interval_minutes` INT NOT NULL DEFAULT 60");

DROP PROCEDURE IF EXISTS __add_col;

-- ---- Enum de notifications: agregar 'plan_reminder' ----
ALTER TABLE `notifications`
    MODIFY COLUMN `type` ENUM('task_reminder', 'plan_reminder') NOT NULL DEFAULT 'task_reminder';
