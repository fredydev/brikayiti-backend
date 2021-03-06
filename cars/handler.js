let response;
const fileToImport = require("./1992.json");
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;
const uuid = require ("uuid")
/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.create_cars = async (event, context) => {
    console.log(fileToImport)
    let promises = [];
    try {
        fileToImport.forEach(item => {
            item.id = uuid.v1()
            const params = {
                TableName: "cars",
                Item: item,
            };
            promises.push(dynamoDb.put(params).promise());
        });
        await Promise.all(promises);
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'File Imported',
            })
        }
    } catch (err) {
        console.log(err);
        throw err;
    }

    return response
};