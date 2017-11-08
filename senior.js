var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db_config = require('../config/db_config.json');

var pool = mysql.createPool({
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
    connectionLimit: db_config.connectionLimit
});


// 봉사 등록하기
router.post('/volunteerinfo/register', function(req, res, next) {


    var user_id=req.body.user_id;
    var location=req.body.location;
    var latitude=req.body.latitude;
    var longitude=req.body.longitude;
    var wish=req.body.wish;
    var date=req.body.date;
    var startTime=req.body.startTime;
    var finishTime=req.body.finishTime;

    var query = 'insert into Matching(user_id, location, latitude, longitude, wish, date, startTime, finishTime) values(?,?,?,?,?,?,?,?);';
    var value=[user_id, location, latitude, longitude, wish, date, startTime, finishTime];

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
                    console.log('Insert info'+'\n');
                    res.sendStatus(200);
                    connection.release();
                }
            });
        }
    });

});

//내가 등록한 모든 봉사정보
router.get('/volunteerinfo/load/all', function(req, res, next) {


    var user_id=req.query.user_id;

    var query = 'select * from Matching where user_id = ?';
    var value=[user_id];

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
                    console.log('Select info'+'\n');
                    res.status(200).send(rows);
                    connection.release();
                }
            });
        }
    });

});

//내가 등록한 특정 봉사정보
router.get('/volunteerinfo/load/one', function(req, res, next) {


    var matching_id=req.query.matching_id;

    var query = 'select * from Matching where matching_id = ?';
    var value=[matching_id];

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
                    console.log('Select info'+'\n');
                    res.status(200).send(rows[0]);
                    connection.release();
                }
            });
        }
    });

});



module.exports = router;
