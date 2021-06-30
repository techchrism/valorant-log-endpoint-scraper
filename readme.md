# Valorant Log Endpoint Scraper
Automatically find unofficial Valorant API endpoints from log files  
It looks through all log files for the typical request format and notes lines that look like they have a url but don't follow the format.  
Then it exports a json file containing the unique endpoint names it finds and the urls for that endpoint.

## Usage
Install dependencies with `npm install` and run with `node index.js`
