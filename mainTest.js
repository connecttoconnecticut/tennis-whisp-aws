const mysql = require('mysql');
const config = require('./config.json');

let conn = mysql.createConnection(config.DATABASE_CONNECTION);

var selectQuery = `INSERT INTO chat (connection_id) VALUES ('asdafdsfdsfsdfsdf');`
conn.query(selectQuery, function(err, result,fields){
    if(err){
        console.log(err);
    }else{
        console.log('success!');
    }
})
