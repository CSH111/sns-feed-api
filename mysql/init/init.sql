-- Grant necessary privileges to app_user for Prisma operations
-- Including shadow database access

-- Global privileges needed for Prisma shadow databases
GRANT CREATE, DROP ON *.* TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES ON *.* TO 'app_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;

-- Show granted privileges (for debugging)
SHOW GRANTS FOR 'app_user'@'%';