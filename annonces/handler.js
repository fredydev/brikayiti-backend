'use strict';
const AWS = require('aws-sdk');
const uuid = require ("uuid")
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const { Table, Entity } = require('dynamodb-toolbox')
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

  // ========== le nom de ces attributs (sub et name) sont des noms reserves dans dynamodb==========
  let cat = {}
  let subcat = {}
  let subcatname = reqBody.category.sub.name
  Object.keys(reqBody.category).map(key=>{
    if(key!=="sub" || key!=="name"){
      cat[key] = reqBody.category[key]
    }
  })
  Object.keys(reqBody.category.sub).map(key=>{
    if(key!=="name"){
      subcat[key] = reqBody.category.sub[key]
    }
  })
  subcat.sub_category_name = subcatname
  
  const annonce = {
    id: uuid.v1(),
    createdAt: new Date().toISOString(),
    title: reqBody.titre_annonce,
    description: reqBody.description,
    images: reqBody.photos,
    coordonnees: reqBody.coordonnees,
    localisation: reqBody.localisation,
    category: cat,
    authorId: reqBody.authorId,
    offer_type: reqBody.offer_type,
    price: Number(reqBody.prix),
    properties: reqBody.properties
  }
  // console.log(annonce)
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


const multiplevalue = (data,queryStrings,attr) => {
  let filters = [...data]
  let modelTab = queryStrings[attr].split(",");
   if(modelTab.length>1){
     let ssFilter = [{attr:`properties.${attr}`,eq:modelTab[0]}]
     for(let i=1;i<modelTab.length;i++){
       let el = { or: true, attr: `properties.${attr}`, eq: modelTab[i] }
       ssFilter = [...ssFilter,el]
     }
     filters = [...filters,ssFilter]
   }
   else{
     filters = [...filters,{attr: `properties.${attr}`,eq: modelTab[0]}]
   } 
  return filters
}
  const rangeValue = (data,queryStrings,attr) => {
    let index = queryStrings.price.indexOf("-");
    let min = Number(queryStrings.price.slice(0,index))
    let max = Number(queryStrings.price.slice(index+1))
    let filters = [...data,{attr:`properties.${attr}`,between:[min,max]}]
    return filters
  }
module.exports.getAnnonces = async (event, context, callback) => {
  const queryStrings=event.queryStringParameters
  console.log(queryStrings)
  if(queryStrings){
    let filterEx = ''
    let expAttVal = {}
    let filters =  [ ]
    if("price" in queryStrings){
        filters = rangeValue(filters,queryStrings,"price")
    }
    if("annee" in queryStrings){
      filters = rangeValue(filters,queryStrings,"annee")
    }
    if("mileage" in queryStrings){
      filters = rangeValue(filters,queryStrings,"mileage")
    }
    if("surface_habitable" in queryStrings){
      filters = rangeValue(filters,queryStrings,"surface_habitable")
  }
  if("pieces" in queryStrings){
    filters = rangeValue(filters,queryStrings,"pieces")
  }

    if("category" in queryStrings){
      filters = [...filters,{attr: "category",eq: queryStrings.category}]
    }
    if("gearbox" in queryStrings){
      filters = [...filters,{attr: "gearbox",eq: queryStrings.gearbox}]
    }
    if("commune" in queryStrings){
      filters = [...filters,{attr: "localisation.commune",eq: queryStrings.commune}]
    }
    if("departement" in queryStrings){
      
      filters = [...filters,{attr: "localisation.departement",eq: queryStrings.departement}]
    }
    if("arrondissement" in queryStrings){
      
      filters = [...filters,{attr: "localisation.arrondissement",eq: queryStrings.arrondissement}]
    }
    if("marque" in queryStrings){
      filters = [...filters,{attr: "properties.marque",eq: queryStrings.marque}]
    }
    if("modele" in queryStrings){
      filters = multiplevalue(filters,queryStrings,"modele",)
    }
    if("color" in queryStrings){
      filters = multiplevalue(filters,queryStrings,"color",)   
    }
    if("vehicle_type" in queryStrings){
     filters = multiplevalue(filters,queryStrings,"vehicle_type",)    
    }
    if("seats" in queryStrings){
      filters = multiplevalue(filters,queryStrings,"seats",)    
     }
     if("doors" in queryStrings){
      filters = multiplevalue(filters,queryStrings,"doors",)    
     }
     if("fuel" in queryStrings){
      filters = multiplevalue(filters,queryStrings,"fuel",)    
     }
    console.log(filterEx)
    console.log(expAttVal)
    let params = {        
      TableName: "annonces_table",   
      FilterExpression:filterEx,
      ExpressionAttributeValues: expAttVal                                                                                                                                    
    };
    if("limit" in queryStrings){
      params = {
        TableName: "annonces_table",
        Limit : Number(queryStrings.limit)
      }
    }
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