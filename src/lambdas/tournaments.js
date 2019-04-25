let mysql = require("mysql");
let request = require("request");
let config = require("../../config.json");

//#region  db_query & connection
let tournamentsQuery = `INSERT INTO tournament (city, location, end_date,
    surface,identifier,year,
    number_of_matches_booked_today,
    number_of_matches,
    events_resource,
    sport,country_code,status,comment,environment,
    tournament_name,utc_offset,start_date,booking_status) VALUES \n`;

let competitionsQuery = `INSERT INTO competition (tournament_identifier, organisation,
    external_id,end_date,competition_type,singles_draw_size,singles_qualifying_draw_size,
    doubles_draw_size,doubles_qualifying_draw_size,competition_id,licencing_property,start_date) VALUES `;

let eventSummariesQuery =
  "INSERT INTO event_summary (tournament_identifier,date,MS,LS,MD,LD,XD,QMS,QLS,QMD,QLD,QXD) VALUES ";

let conn = mysql.createConnection(config.DATABASE_CONNECTION);

//#endregion

var tempEventSummaryObject = {
  tournamentId: "",
  date: "",
  MS: null,
  LS: null,
  MD: null,
  LD: null,
  XD: null,
  QMS: null,
  QLS: null,
  QMD: null,
  QLD: null,
  QXD: null
};

module.exports.getTournaments = (event, context, callback) => {
  //var parsingTournaments = function(){
  request(
    {
      url: config.DDE_API_ROUTES.tournamentsDDEapi,
      json: true,
      headers: config.DDE_REQ_HEADERS,
      method: "GET"
    },
    function(error, response, body) {
      if (error) {
        throw error;
      } else {
        if (body !== null) {
          var jsonData = body;
          tournamentsParser(jsonData, function(
            tournamentsQuery,
            competitionsQuery,
            eventSummariesQuery
          ) {
            conn.connect(function(err) {
              if (err) throw err;
              console.log("Connected to db ...");
              writeToDb(
                tournamentsQuery,
                competitionsQuery,
                eventSummariesQuery,
                function(gate) {
                  if (gate) {
                    console.log("Tournamets parsing done.");
                    context.succeed("Context: Done!");
                    callback(null, "Success!");
                  }
                }
              );
            });
          });
        }
      }
    }
  );
};
let writeToDb = function(
  tournamentsQuery,
  competitionsQuery,
  eventSummariesQuery,
  callback
) {
  conn.query(tournamentsQuery, function(err, result) {
    if (err) throw err;
    conn.query(competitionsQuery, function(err, result) {
      if (err) throw err;
      conn.query(eventSummariesQuery, function(err, result) {
        if (err) throw err;
        callback(true);
      });
    });
  });
};

var tournamentsParser = function(jsonData, callback) {
  for (let i = 0; i < jsonData.length; i++) {
    tournamentsQuery += "(";

    var tempTournamentObject = {
      city: jsonData[i].city,
      location: jsonData[i].location,
      endDate: jsonData[i].endDate,
      surface: jsonData[i].surface,
      identifier: jsonData[i].identifier,
      year: jsonData[i].year,
      numberOfMatchesBookedToday: jsonData[i].numberOfMatchesBookedToday,
      numberOfMatches: jsonData[i].numberOfMatches,
      eventsResource: jsonData[i].eventsResource,
      sport: jsonData[i].sport,
      countryCode: jsonData[i].countryCode,
      status: jsonData[i].status,
      comment: jsonData[i].comment,
      environment: jsonData[i].environment,
      tournamentName: jsonData[i].tournamentName,
      utcOffset: jsonData[i].utcOffset,
      startDate: jsonData[i].startDate,
      bookingStatus: jsonData[i].bookingStatus.status
    };
    for (let tourKey in tempTournamentObject) {
      if (
        tempTournamentObject[tourKey] === undefined ||
        tempTournamentObject[tourKey] === null
      ) {
        if (tourKey !== "bookingStatus") {
          tournamentsQuery += "null,";
        } else {
          tournamentsQuery += "null";
        }
      } else {
        if (
          typeof tempTournamentObject[tourKey] !== "object" &&
          tourKey !== "bookingStatus"
        ) {
          if (typeof tempTournamentObject[tourKey] === "string") {
            if (tempTournamentObject[tourKey].includes(`'`)) {
              var temp =
                tempTournamentObject[tourKey].slice(
                  0,
                  tempTournamentObject[tourKey].indexOf(`'`)
                ) +
                `'` +
                tempTournamentObject[tourKey].slice(
                  tempTournamentObject[tourKey].indexOf(`'`)
                );
              tournamentsQuery += `'${temp}',`;
            } else {
              tournamentsQuery += `'${tempTournamentObject[tourKey]}'` + ",";
            }
          } else {
            tournamentsQuery += tempTournamentObject[tourKey] + ",";
          }
        }
      }

      if (tourKey === "bookingStatus") {
        tournamentsQuery += `'${tempTournamentObject.bookingStatus}'`;
      }
    }

    for (let j = 0; j < jsonData[i].competitions.length; j++) {
      let competition = jsonData[i].competitions[j];
      competitionsQuery += "(" + jsonData[i].identifier + ",";
      for (let compKey in competition) {
        if (
          competition[compKey] === null ||
          competition[compKey] === "undefined"
        ) {
          competitionsQuery += "null";
        } else {
          if (typeof competition[compKey] !== "object") {
            if (typeof competition[compKey] === "string") {
              competitionsQuery += `'${competition[compKey]}'`;
            } else {
              competitionsQuery += competition[compKey];
            }
          }
        }
        if (compKey === "startDate") {
          competitionsQuery += "),\n";
        } else {
          competitionsQuery += ",";
        }
      }
    }

    for (let key in jsonData[i].eventsSummary) {
      var eventSummary = jsonData[i].eventsSummary[key];
      for (var summKey in eventSummary) {
        tempEventSummaryObject[summKey] = eventSummary[summKey];
      }
      tempEventSummaryObject.tournamentId = jsonData[i].identifier;
      tempEventSummaryObject.date = key;
      eventSummariesQuery += "(";
      for (let tempkey in tempEventSummaryObject) {
        if (
          tempEventSummaryObject[tempkey] === null ||
          tempEventSummaryObject[tempkey] === "undefined"
        ) {
          eventSummariesQuery += "null";
        } else {
          if (typeof tempEventSummaryObject[tempkey] !== "object") {
            if (typeof tempEventSummaryObject[tempkey] === "string") {
              eventSummariesQuery += `'${tempEventSummaryObject[tempkey]}'`;
            } else {
              eventSummariesQuery += tempEventSummaryObject[tempkey];
            }
          }
        }
        if (tempkey === "QXD") {
          eventSummariesQuery += "),\n";
        } else {
          eventSummariesQuery += ",";
        }
      }
    }
    if (i === jsonData.length - 1) {
      tournamentsQuery += ");\n";
    } else {
      tournamentsQuery += "),\n";
    }
  }
  competitionsQuery = competitionsQuery.slice(0, -2) + ";";
  eventSummariesQuery = eventSummariesQuery.slice(0, -2) + ";";
  callback(tournamentsQuery, competitionsQuery, eventSummariesQuery);
};
