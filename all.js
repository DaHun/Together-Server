var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db_config = require('../config/db_config.json');
var aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
var s3 = new aws.S3();
var multer = require('multer');
var multerS3 = require('multer-s3');


var pool = mysql.createPool({
    host: db_config.host,
    port: db_config.port,
    user: db_config.user,
    password: db_config.password,
    database: db_config.database,
    connectionLimit: db_config.connectionLimit
});


var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'togetherproject2',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});



// 유저 등록하기
router.post('/user/register', function(req, res, next) {

    var name=req.body.name;
    var phone=req.body.phone;
    var age=req.body.age;
    var gender=req.body.gender;
    var token=req.body.token;

    console.log(name);
    console.log(phone);
    console.log(age);
    console.log(gender);
    console.log(token);

    var query = 'insert into User(name, age, gender, phone, token) values(?,?,?,?,?);';
    var value=[name, age, gender, phone, token];

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

                    query='SELECT user_id FROM User WHERE phone = ? ORDER BY user_id DESC limit 1';
                    value=[phone];
                    connection.query(query,value,function(error2, rows2) {
                        if (error2) {
                            console.log("Connection Error" + error);
                            res.sendStatus(500);
                            connection.release();
                        } else {
                            console.log('Register User');
                            console.log(Number(rows2[0].user_id));
                            res.send(rows2[0]);
                            connection.release();
                        }
                    });
                    //
                }
            });
        }
    });

});




module.exports = router;
