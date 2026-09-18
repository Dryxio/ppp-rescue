import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',use:{baseURL:'http://127.0.0.1:4178',channel:process.env.PW_CHANNEL||'chrome'},webServer:{command:'npm run dev -- --port 4178 --strictPort',url:'http://127.0.0.1:4178',reuseExistingServer:false}});
