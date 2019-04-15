const mysql = require('mysql');
const config = require('./config.json');

let conn = mysql.createConnection(config.DATABASE_CONNECTION);

var selectQuery = 'SELECT * FROM chat';

conn.query(selectQuery, function(err, result,fields){
    if(err){
        console.log(err);
    }else{
        result.forEach(function(val){
            console.log(val.connection_id);
        });
    }
})
