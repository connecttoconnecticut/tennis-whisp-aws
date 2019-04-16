'use strict';
const mysql = require('mysql');
const config = require('../../config.json');

const succesfullResponse = {
    statusCode: 200,
    body: 'ConnHandler -> Everything is alright...'
}

module.exports.connectionHandler = (event,context,callback) => {
    console.log('ConnHandler -> event:: ' + event);
    if(event.requestContext.eventType === 'CONNECT'){
        addConnection(event.requestContext.connectionId,function(connErr,succ){
            if(succ){
                callback(null,succesfullResponse);
            }else{
                callback(null, {
                    statusCode: 500,
                    body: 'Failed to connect to db: ' + JSON.stringify(connErr)
                });
            };
        });
    }else if(event.requestContext.eventType === 'DISCONNECT'){
        deleteConnection(event.requestContext.connectionId,function(connErr,succ){
            if(succ){
                callback(null,succesfullResponse);
            }else{
                callback(null, {
                    statusCode: 500,
                    body: 'Failed to connect to db: ' + JSON.stringify(connErr)
                });
            };
        });
    }
}

//let conn = mysql.createConnection(config.DATABASE_CONNECTION);

function addConnection (connection_id,callback){
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    let insertquery = `INSERT INTO chat (connection_id) VALUES ('${connection_id}');`;
    conn.query(insertquery,function(err){
        if(err){
            console.log('ConnHandler -> Addconnection err: ' + err);
            callback(err,false);
        }else{
            console.log('ConnHandler -> Addconnection: Success!');
            callback(null,true);
        }
    })
}

function deleteConnection (connection_id,callback){
    let conn = mysql.createConnection(config.DATABASE_CONNECTION);
    let deletequery = `DELETE FROM chat WHERE connection_id='${connection_id}';`;
    conn.query(deletequery,function(err){
        if(err){
            console.log('ConnHandler -> Deleteconnection err: ' + err);
            callback(err,false);
        }else{
            console.log('ConnHandler -> Deleteconnection: Success!');
            callback(null,true);
        }
    })
}