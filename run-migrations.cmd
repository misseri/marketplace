@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo === DB migrator (Flyway) ===
echo (Enter = use defaults)
echo.

set "DB_URL_DEFAULT=jdbc:postgresql://localhost:5432/marketplace"
set "DB_USER_DEFAULT=postgres"
set "FLYWAY_LOCATIONS_DEFAULT=classpath:db/migration"

set /p "DB_URL=DB_URL [%DB_URL_DEFAULT%]: "
if "%DB_URL%"=="" set "DB_URL=%DB_URL_DEFAULT%"

set /p "DB_USER=DB_USER [%DB_USER_DEFAULT%]: "
if "%DB_USER%"=="" set "DB_USER=%DB_USER_DEFAULT%"

set /p "DB_PASSWORD=DB_PASSWORD (will be visible): "

set /p "FLYWAY_LOCATIONS=FLYWAY_LOCATIONS [%FLYWAY_LOCATIONS_DEFAULT%]: "
if "%FLYWAY_LOCATIONS%"=="" set "FLYWAY_LOCATIONS=%FLYWAY_LOCATIONS_DEFAULT%"

set "DB_URL=%DB_URL%"
set "DB_USER=%DB_USER%"
set "DB_PASSWORD=%DB_PASSWORD%"
set "FLYWAY_LOCATIONS=%FLYWAY_LOCATIONS%"

echo.
echo Using settings:
echo   DB_URL=%DB_URL%
echo   DB_USER=%DB_USER%
echo   FLYWAY_LOCATIONS=%FLYWAY_LOCATIONS%

echo.
echo Building migrator...
call "migration_bd\mvnw.cmd" -f "migration_bd\pom.xml" -DskipTests clean package
if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

echo.
echo Running migrator...
java -jar "migration_bd\target\db-migrator-1.0.0.jar"
set "EC=%ERRORLEVEL%"

echo.
echo Done. Exit code: %EC%
exit /b %EC%
