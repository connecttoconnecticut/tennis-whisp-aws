let mysql = require("mysql");
let request = require("request");
let async = require("async");
let config = require("../../../config.json");

//#region db_query & connection
let eventObjectsQuery = `INSERT INTO event (start_time_status,start_time,court_seq,court_name,start_time_next,teamA_player1_id,teamA_player2_id, match_type,event_id,date,status,round,teamB_player1_id,teamB_player2_id,competition_id,booking_status,court_id) VALUES `;
let teamsQuery =
  "INSERT INTO team (player_1,player_2,entry_type,status,event_id,seed) VALUES ";
let conn = mysql.createConnection(config.DATABASE_CONNECTION);
//#endregion

let teamTempObj = {
  player_1: null,
  player_2: null,
  seed: null,
  entry_type: null,
  status: null,
  event_id: null
};

var parsingEvents = function(dataEndpoint, callback) {
  conn.query("SELECT * FROM tournament ", (err, rows) => {
    if (err) {
      console.log(err);
      callback(err);
    } else {
      var tournaments = rows;
      async.map(
        tournaments,
        function(item, mapCallback) {
          request(
            {
              url: dataEndpoint + `${item.identifier}/events`,
              json: true,
              headers: config.DDE_REQ_HEADERS
            },
            function(error, response, body) {
              let jsonData = body;
              eventsParser(jsonData, function(eventObjectsQuery, teamsQuery) {
                eventObjectsQuery = eventObjectsQuery.slice(0, -2) + ";";
                teamsQuery = teamsQuery.slice(0, -2) + ";";
                conn.query(eventObjectsQuery, function(err, result) {
                  if (err) throw err;
                  conn.query(teamsQuery, function(err, result) {
                    if (err) throw err;
                    callback("Tournament Events Parsing done.");
                  });
                });
              });
              mapCallback(null, {
                eventObjectsQuery,
                teamsQuery
              });
            }
          );
        },
        function(err, mapCallbackQuerys) {
          //context.succeed('Context: Done!');
          //callback(null, 'Success!');
        }
      );
    }
  });
};

module.exports = parsingEvents;

var eventsParser = function(jsonData, callback) {
  console.log("Events parser started ...");
  for (var event in jsonData) {
    var currentEvent = jsonData[event];
    eventObjectsQuery += "(";
    for (var key in currentEvent) {
      var currField = currentEvent[key];
      if (typeof currField === "object") {
        for (var okey in currField) {
          var objField = currField[okey];
          if (okey.includes("team")) {
            teamsQuery += "(";
            var team = objField;
            if (team.player2 !== undefined) {
              teamTempObj = {
                player_1: team.player1.id,
                player_2: team.player2.id,
                entry_type: team.entryType,
                status: currField.status,
                event_id: currentEvent.eventId,
                seed: team.seed
              };
            } else {
              teamTempObj = {
                player_1: team.player1.id,
                player_2: undefined,
                entry_type: team.entryType,
                status: currField.status,
                event_id: currentEvent.eventId,
                seed: team.seed
              };
            }

            for (var ttoKey in teamTempObj) {
              if (ttoKey === "seed") {
                if (teamTempObj[ttoKey] !== undefined) {
                  teamsQuery += `${teamTempObj[ttoKey]}),\n`;
                } else {
                  teamsQuery += `null),\n`;
                }
              } else {
                if (teamTempObj[ttoKey] === undefined) {
                  teamsQuery += `null,`;
                } else {
                  teamsQuery += `'${teamTempObj[ttoKey]}',`;
                }

                if (ttoKey.includes("player")) {
                  if (teamTempObj[ttoKey] !== undefined) {
                    eventObjectsQuery += `'${teamTempObj[ttoKey]}',`;
                  } else {
                    eventObjectsQuery += `null,`;
                  }
                }
              }
            }
          } else {
            if (key === "startTime") {
              eventObjectsQuery += `'${objField}',`;
            }

            if (key === "bookingStatus") {
              eventObjectsQuery += `'${objField}',`;
            }
          }
        }
      } else {
        if (key === "courtId") {
          eventObjectsQuery += `${currentEvent[key]}),\n`;
        } else {
          if (typeof currentEvent[key] === "string") {
            eventObjectsQuery += `'${currentEvent[key]}',`;
          } else {
            eventObjectsQuery += `${currentEvent[key]},`;
          }
        }
      }
    }
  }
  callback(eventObjectsQuery, teamsQuery);
};
