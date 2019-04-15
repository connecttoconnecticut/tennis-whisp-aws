'use strict';

const succesfullResponse = {
    statusCode: 200,
    body: 'Everything is alright...'
}

module.exports.connectionHandler = (event,context,callback) => {
    console.log(event);
    if(event.requestContext.eventType === 'CONNECT'){

    }else if(event.requestContext.eventType === 'DISCONNECT'){

    }
}