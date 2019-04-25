let events = require('./common/events');
let config = require('../../config.json');

module.exports.tournamentEvents = (event, context, callback) => {
    events(config.DDE_API_ROUTES.tournamentsDataDDEapi, function(res){
         console.log(res);
         context.succeed('Context: Done!');
         callback(null,'Success!');
    })
}