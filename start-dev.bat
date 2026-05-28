@echo off
start "Backend - myFamilyTree" cmd /k "cd /d %~dp0Project_tree\myFamilyTree && npm run dev"
start "Frontend - FE/tree" cmd /k "cd /d %~dp0Project_tree\FE\tree && npm run dev"
