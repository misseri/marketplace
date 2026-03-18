@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo === DB migrator (Flyway) ===
echo (Enter = use defaults)
echo.

set "DB_URL_DEFAULT=jdbc:postgresql://localhost:5432/marketplace"
set "DB_USER_DEFAULT=postgres"

set /p "DB_URL=DB_URL [%DB_URL_DEFAULT%]: "
if "%DB_URL%"=="" set "DB_URL=%DB_URL_DEFAULT%"

set /p "DB_USER=DB_USER [%DB_USER_DEFAULT%]: "
if "%DB_USER%"=="" set "DB_USER=%DB_USER_DEFAULT%"

set /p "DB_PASSWORD=DB_PASSWORD (will be visible): "

set "DB_URL=%DB_URL%"
set "DB_USER=%DB_USER%"
set "DB_PASSWORD=%DB_PASSWORD%"

echo.
echo Building migrator...
call "migration_bd\mvnw.cmd" -f "migration_bd\pom.xml" -DskipTests package
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

