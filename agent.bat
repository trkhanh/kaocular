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

REM Function to prompt for API key securely
:prompt_api_key
set key_name=%1
set key_value=

REM Check if key exists in .env
if exist "%SCRIPT_DIR%.env" (
    for /f "tokens=2 delims==" %%a in ('findstr /b "%key_name%=" "%SCRIPT_DIR%.env"') do set key_value=%%a
)

REM Remove quotes if present
set key_value=%key_value:"=%
set key_value=%key_value:'=%

REM Check if key is empty or placeholder
if "%key_value%"=="" goto :ask_key
if "%key_value%"=="your_%key_name:~0,-8%_api_key_here" goto :ask_key
if "%key_value%"=="your_%key_name:~0,-8%_key_here" goto :ask_key
goto :key_done

:ask_key
echo ⚠️  %key_name% not found or invalid
echo Please enter your %key_name% (input will be hidden):
set /p key_value=
if "%key_value%"=="" (
    echo ❌ No API key provided
    exit /b 1
)

REM Update .env file
if exist "%SCRIPT_DIR%.env" (
    findstr /v /b "%key_name%=" "%SCRIPT_DIR%.env" > "%SCRIPT_DIR%.env.tmp"
    echo %key_name%=%key_value% >> "%SCRIPT_DIR%.env.tmp"
    move "%SCRIPT_DIR%.env.tmp" "%SCRIPT_DIR%.env"
) else (
    echo %key_name%=%key_value% > "%SCRIPT_DIR%.env"
)
echo ✅ %key_name% saved to .env

:key_done
set %key_name%=%key_value%
goto :eof

REM Check and prompt for API keys
echo 🔑 Checking API keys...

REM Check for existing API keys
if exist "%SCRIPT_DIR%.env" (
    for /f "delims=" %%i in ('type "%SCRIPT_DIR%.env" ^| findstr /v "^#"') do set %%i
)

REM If no API keys found, prompt user
if "%CEREBRAS_API_KEY%"=="" (
    echo No Cerebras API key found.
    call :prompt_api_key CEREBRAS_API_KEY
)

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
