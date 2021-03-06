'use strict';
const AWS = require('aws-sdk');
const uuid = require ("uuid")
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

// https://www.serverless.com/blog/node-rest-api-with-serverless-lambda-and-dynamodb


// const annoncesTable  = process.env.ANNONCES
const  response = (statusCode, message) => {
  return {
    headers: {"Access-Control-Allow-Origin": "*", 'Access-Control-Allow-Credentials': true},
    statusCode: statusCode,
    body: JSON.stringify(message)
  };
}

module.exports.createAnnonces = async (event, context, callback) => {
  const reqBody = JSON.parse(event.body);
  const annonce = {
    id: uuid.v1(),
    createdAt: new Date().toISOString(),
    title: reqBody.titre_annonce,
    description: reqBody.description,
    images: reqBody.photos,
    category: reqBody.category,
    authorId: reqBody.authorId,
    offer_type: reqBody.offer_type,
    prix: reqBody.prix,
    properties: reqBody.properties
  }
  console.log(annonce)
  return db
    .put({
      TableName: "annonces_table",
      Item: annonce
    })
    .promise()
    .then(() => {
      callback(null, response(201, annonce ));
    })
    .catch((err) => {
      console.log(err)
      callback(null, response(err.statusCode, err))

    });
};


module.exports.getAnnonces = async (event, context, callback) => {
  const queryStrings=event.queryStringParameters
  console.log(queryStrings)
  if(queryStrings){
    // let filterEx = ''
    // let expAttVal = {}
    // if("min" in queryStrings){
    //    expAttVal = { ":min_val": queryStrings.min,
    //    ":max_val": queryStrings.max}
    //   filterEx = 'prix between :min_val and :max_val'
    // }
    // if("category" in queryStrings){
    //   filterEx = 'category.sub_category.slug = :category_val'
    //    expAttVal = {":category_val": queryStrings.category}
    // }
    // if("comm" in queryStrings){
    //   filterEx = 'localisation.commune = :commune_val'
    //    expAttVal = {":commune_val": queryStrings.comm}
    // }
    // if("dept" in queryStrings){
    //   filterEx = 'location.departement = :dept_val'
    //    expAttVal = {":dept_val": queryStrings.dept}
    // }
    // console.log(filterEx)
    // console.log(expAttVal)
    let params = {        
      TableName: "annonces_table",   
      FilterExpression:"category.sub_category.slug = :category_val",
      ExpressionAttributeValues: {":category_val": queryStrings.category}                                                                                                                                     
    };
    return db
    .scan(params)
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items));
    })
    .catch((err) => {
      console.log(err)
      callback(null, response(err.statusCode, err))
    });
  }
  
  return db
    .scan({
      TableName: "annonces_table"
    })
    .promise()
    .then((res) => {
      callback(null, response(200, res.Items));
    })
    .catch((err) => callback(null, response(err.statusCode, err)));
};

module.exports.getAnnonce = async (event, context, callback) => {
  const id = event.pathParameters.annonceId;
  console.log(id)
  const params = {
    Key: {
      id: id
    },
    TableName: "annonces_table"
  };
  return db
    .get(params)
    .promise()
    .then((res) => {
      if (res.Item) callback(null, response(200, res.Item));
      else callback(null, response(404, { error: 'annonce not found' }));
    })
    .catch((err) => {
      console.log(err)
      callback(null, response(err.statusCode, err))
    });
};