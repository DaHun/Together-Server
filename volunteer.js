var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db_config = require('../config/db_config.json');
var gcm=require('node-gcm');

var server=require('../config/push.json');
var server_api_key=server.key;
var sender=new gcm.Sender(server_api_key);
var registrationIds=[];


var pool = mysql.createPool({
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
    connectionLimit: db_config.connectionLimit
});


//봉사자: 자기 위치에서 반경 nkm 있는것만 봉사등록 리스트 받아오기
router.get('/volunteerinfo/load', function(req, res, next) {

    var latitude=req.query.latitude;
    var longitude=req.query.longitude;

    var query = "SELECT distinct *,(6371*acos(cos(radians(?))*cos(radians(latitude))*cos(radians(longitude)-radians(?))+sin(radians(?))*sin(radians(latitude)))) AS distance FROM Matching HAVING distance <= 1.0 ORDER BY distance"
    var value=[latitude, longitude, latitude];

    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {
            connection.query(query, value ,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {
                    console.log('senior info : '+rows.length);
                    console.log(rows+"\n\n");

                    var result=[];
                    for(var i=0, j=0; i<rows.length;i++){


                        if(parseInt(rows[i].isMatched) != parseInt(1)){

                            result[j]={
                                matching_id: rows[i].matching_id,
                                user_id: rows[i].user_id,
                                location: rows[i].location,
                                latitude: rows[i].latitude,
                                longitude: rows[i].longitude,
                                wish: rows[i].wish,
                                date: rows[i].date,
                                startTime: rows[i].startTime,
                                finishTime: rows[i].finishTime,
                                check: rows[i].check
                            }
                            j++;
                        }
                    }
                  //  console.log(result);

                    res.status(200).send(result);
                    connection.release();
                }
            });
        }
    });

});


//봉사자: 매칭하기
router.put('/volunteerinfo/matching', function(req, res, next) {

    var matching_id=req.query.matching_id;
    var user_id=req.query.user_id;

    var query = 'insert into MatchingInfo(matching_id, user_id) values(?,?);';
    var value=[matching_id, user_id];


    pool.getConnection(function(error, connection) {
        if (error) {
            console.log("getConnection Error" + error);
            res.sendStatus(500);
        } else {

            connection.query(query, value ,function(error, rows) {
                if (error) {
                    console.log("Connection Error" + error);
                    res.sendStatus(500);
                    connection.release();
                } else {

                    query = 'UPDATE Matching SET isMatched = 1 where matching_id = ?';
                    value=[matching_id];


                    connection.query(query, value, function(error2, rows2){
                        if(error){
                            console.log("connection error "+error);
                            res.sendStatus(500);
                            connection.release();
                        }else{

                            console.log("check update");

                            //////
                            query = 'select * from Matching where matching_id = ?';
                            value=[matching_id];

                            connection.query(query, value, function(error3, rows3){
                                if(error){
                                    console.log("Connection Error" + error3);
                                    res.sendStatus(500);
                                    connection.release();
                                }
                                else{

                                    query = 'select * from User where user_id = ?';
                                    value=[rows3[0].user_id];

                                    connection.query(query, value, function(error4, rows4){
                                        if(error){
                                            console.log("Connection Error" + error4);
                                            res.sendStatus(500);
                                            connection.release();
                                        }
                                        else{


                                            console.log('Matching Success : ');

                                            //gcm
                                            var pushMessage=new gcm.Message({
                                                collapseKey: 'demo',
                                                delayWhileIdle: true,
                                                timeToLive: 3,

                                                data:{
                                                    title: 'Together',
                                                    message: '매칭되었습니다'
                                                }
                                            });

                                            var token=rows4[0].token;
                                            registrationIds.push(token);

                                            sender.send(pushMessage, registrationIds, 4, function(err, result){
                                                console.log(result);
                                            });
                                            //

                                            res.sendStatus(200);
                                            connection.release();
                                        }
                                    });
                                }
                            });


                            ///////

                        }

                    });

                }
            });
        }
    });

});






module.exports = router;
