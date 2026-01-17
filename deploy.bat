@echo off
echo Building project...
call npm run build

echo.
echo Deploying to Vercel...
call npx vercel --prod

pause
