'use strict'
const awsServerlessExpress = require('aws-serverless-express')
const app = require('./index'); // Assuming 'app.js' is in the same directory
const binaryMimeTypes = [
    'application/json',
    'application/octet-stream',
    'font/eot',
    'font/opentype',
    'font/otf',
    'image/jpeg',
    'image/png',
    'image/svg+xml'
]

let serverlessExpressInstance;
async function setup(event, context) {
    serverlessExpressInstance = awsServerlessExpress.createServer(app, null, binaryMimeTypes);
    return awsServerlessExpress.proxy(serverlessExpressInstance, event, context)
}

exports.handler = async function (event, context) {
    global.lambdaContext = context;
    return new Promise(async (resolve, reject) => {
        if (serverlessExpressInstance) {
            return awsServerlessExpress.proxy(serverlessExpressInstance, event, context)
        }
        return await setup(event, context)
    });
}