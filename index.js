const fs = require('fs');
const path = require('path');
const es = require('event-stream');

const requestsRegex = /QueryName: \[(?<name>.+?)], URL \[(?<method>\w+?) (?<url>.+?)], TraceID: \[.+?] Response Code: \[(?<code>\d+)]/;

async function processLog(filePath)
{
    return new Promise((resolve, reject) =>
    {
        let requests = [];
        let other = [];
        
        fs.createReadStream(filePath, {
            flags: 'r',
            encoding: 'utf8'
        }).pipe(es.split()).pipe(es.through(function write(data)
        {
            const endpointMatch = data.match(requestsRegex);
            if(endpointMatch !== null)
            {
                requests.push(endpointMatch.groups);
            }
            else if(data.includes('https'))
            {
                other.push(data);
            }
        }, function end()
        {
            resolve({requests, other});
        }));
    });
}

const logsDir = path.join(process.env.LOCALAPPDATA, '/VALORANT/Saved/Logs/');
(async () =>
{
    const files = await fs.promises.readdir(logsDir);
    let endpoints = {};
    let other = [];
    for(const fileName of files)
    {
        const processedData = await processLog(path.join(logsDir, fileName));
        for(const request of processedData.requests)
        {
            if(!endpoints.hasOwnProperty(request.name))
            {
                endpoints[request.name] = {urls: []};
            }
            const urlStr = request.method + ' ' + request.url;
            if(!endpoints[request.name].urls.includes(urlStr))
            {
                endpoints[request.name].urls.push(urlStr);
            }
            
        }
        other = other.concat(processedData.other);
    }
    
    console.log(`Found ${Object.keys(endpoints).length} unique endpoints`);
    try
    {
        await fs.promises.mkdir('./out');
    } catch(ignored) {}
    await fs.promises.writeFile('./out/endpoints.json', JSON.stringify({endpoints, other}, null, 4), 'utf-8');
    console.log('Wrote to ./out/endpoints.json');
})();
