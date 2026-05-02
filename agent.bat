@echo off
setlocal enabledelayedexpansion

REM Stagehand Browser Agent Batch Script for Windows

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Check if tsx is available
where tsx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: tsx is not installed
    echo Please install tsx first:
    echo   npm install -g tsx
    echo   or
    echo   pnpm add -g tsx
    exit /b 1
)

REM Check if node_modules exists
if not exist "%SCRIPT_DIR%node_modules" (
    echo Warning: node_modules not found
    echo Please run 'pnpm install' or 'npm install' first
    exit /b 1
)

REM Setup complete for local AI models
echo 🔑 Using local AI models...

REM Check first argument
if "%1"=="" goto :help
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help
if "%1"=="--run" goto :run
if "%1"=="-r" goto :run
if "%1"=="--test" goto :test
if "%1"=="-t" goto :test

echo Unknown command: %1
goto :help

:run
echo Starting agent server...
echo Browser will open and stay visible
echo.
cd /d "%SCRIPT_DIR%"
tsx src/agent/agent-server.ts
goto :end

:test
REM Remove --test from arguments and pass the rest
shift
set args=
:loop
if "%~1"=="" goto :dotest
set args=!args! %1
shift
goto :loop

:dotest
cd /d "%SCRIPT_DIR%"
tsx src/agent/agent-client.ts %args%
goto :end

:help
echo ╔════════════════════════════════════════════════════════════════╗
echo ║            Stagehand Browser Agent CLI                        ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Usage: agent.bat [command] [options]
echo.
echo Commands:
echo   --run           Start the agent server with browser
echo   --test          Send test command to running agent
echo   --help          Show this help message
echo.
echo Test Options:
echo   -context ^<text^> Optional context to add to the test
echo   ^<instruction^>   The instruction for the agent to execute
echo.
echo Examples:
echo   # Start the agent server
echo   agent.bat --run
echo.
echo   # Send test commands
echo   agent.bat --test "Click the Test Console button"
echo   agent.bat --test -context "Testing forms" "Fill the form"

:end
endlocal
