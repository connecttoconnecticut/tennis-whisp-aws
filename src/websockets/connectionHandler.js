'use strict';
const mysql = require('mysql');
const config = require('../../config.json');

//require('aws-sdk/clients/apigatewaymanagmentapi');

const succesfullResponse = {
    "statusCode": 200,
    "body": 'ConnHandler -> Everything is alright...',
    "isBase64Encoded" : false
}

module.exports.connectionHandler = (event,context,callback) => {
    console.log('ConnHandler -> event:: ' + JSON.stringify(event));
    if(event.requestContext.eventType === 'CONNECT'){
        addConnection(event.requestContext.connectionId,function(connErr,succ){
            if(succ){
                console.log('ConnHandler -> Addconnection: Success!');
                callback(null,(succesfullResponse));
                context.succeed('Connect -> Done!');
            }else{
                xcallback(null, JSON.stringify({
                    "statusCode": 500,
                    "body": 'Failed to connect to db: ' + JSON.stringify(connErr)
                }));
                context.succeed('Connect -> Done!');
            };
        });
    }else if(event.requestContext.eventType === 'DISCONNECT'){
        deleteConnection(event.requestContext.connectionId,function(connErr,succ){
            if(succ){
                console.log('ConnHandler -> Deleteconnection: Success!');
                callback(null,JSON.stringify(succesfullResponse));
                context.succeed('Disconnect -> Done!');
            }else{
                callback(null, JSON.stringify({
                    "statusCode": 500,
                    "body": 'Failed to connect to db: ' + JSON.stringify(connErr)
                }));
                context.succeed('Disconnect -> Error!');
            };
        });
    }
}

//let conn = mysql.createConnection(config.DATABASE_CONNECTION);

function addConnection (connection_id,callback){
    console.log('Add connection -> Called!');
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    let insertquery = `INSERT INTO chat (connection_id) VALUES ('${connection_id}');`;
    conn.query(insertquery,function(err){
        if(err){
            console.log('ConnHandler -> Addconnection err: ' + err);
            callback(err,false);
        }else{
            callback(null,true);
        }
    })
}

function deleteConnection (connection_id,callback){
    console.log('Delete connection -> Called!');
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    let deletequery = `DELETE FROM chat WHERE connection_id='${connection_id}';`;
    conn.query(deletequery,function(err){
        if(err){
            console.log('ConnHandler -> Deleteconnection err: ' + err);
            callback(err,false);
        }else{
            //console.log('ConnHandler -> Deleteconnection: Success!');
            callback(null,true);
        }
    })
}