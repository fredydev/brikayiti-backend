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


module.exports.getAnnonces = async (event, context, callback) => {
  const queryStrings=event.queryStringParameters
  console.log(queryStrings)
  if(queryStrings){
    let filterEx = ''
    let expAttVal = {}
    
    if("price" in queryStrings){
      let index = queryStrings.price.indexOf("-");
      let min = queryStrings.price.slice(0,index)
      let max = queryStrings.price.slice(index+1)
       expAttVal = { ":min_val": Number(min),
       ":max_val": Number(max)}
      filterEx = 'prix >= :min_val and prix <= :max_val'
    }
    if("category" in queryStrings){
      if(filterEx.length>0){
        filterEx = filterEx+" and"+' category.sub_category.slug = :subcategory_val'
        expAttVal[":subcategory_val"] =  queryStrings.subcat
      }
      else{
        filterEx = 'category.sub_category.slug = :subcategory_val'
        expAttVal = {":subcategory_val": queryStrings.subcat}
      }
    }
    if("cat" in queryStrings){
      if(filterEx.length>0){
        filterEx = filterEx+" and"+' category.slug = :category_val'
        expAttVal[":category_val"] =  queryStrings.cat
      }
      else{
        filterEx = 'category.slug = :category_val'
        expAttVal = {":category_val": queryStrings.cat}
      }
    }
    if("commune" in queryStrings){
      if(filterEx.length>0){
        filterEx = filterEx+" and"+' localisation.commune = :commune_val'
        expAttVal[":commune_val"] = queryStrings.comm
      }
      else{
        filterEx = 'localisation.commune = :commune_val'
        expAttVal = {":commune_val": queryStrings.comm}
      }
      
    }
    if("departement" in queryStrings){
      if(filterEx.length>0){
        filterEx = filterEx+" and"+ ' localisation.departement = :dept_val'
        expAttVal[":dept_val"] = queryStrings.dept
      }
      else{
        filterEx = 'localisation.departement = :dept_val'
        expAttVal = {":dept_val": queryStrings.dept}
      }
      
    }
    if("marque" in queryStrings){
      if(filterEx.length>0){
        filterEx = filterEx+" and"+ ' properties.marque.valeur = :marq_val'
        expAttVal[":marq_val"] = queryStrings.marque
      }
      else{
        filterEx = 'properties.marque.valeur = :marq_val'
        expAttVal = {":marq_val": queryStrings.marque}
      }
      
    }
    if("modele" in queryStrings){
      // let modelTab = queryStrings.modele.split(",");
      
      // let min = queryStrings.price.slice(0,index)
      // let max = queryStrings.price.slice(index+1)
      if(filterEx.length>0){
        filterEx = filterEx+" and"+ ' properties.modele.valeur = :modele_val'
        expAttVal[":modele_val"] = queryStrings.modele
      }
      else{
        filterEx = 'properties.modele.valeur = :modele_val'
        expAttVal = {":modele_val": queryStrings.modele}
      }
      
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