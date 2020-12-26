var express = require('express')
    ,http = require('http')
    ,path= require('path');

var bodyParser = require('body-parser')
    ,cookieParser = require('cookie-parser')
    ,static = require('serve-static')
    ,errorHandler = require('errorhandler');

var expressErrorHandler = require('express-error-handler');

var expressSession = require('express-session');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/public', static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));

var router = express.Router();

router.route('/process/login').post(function(req,res){
    console.log("/process/login이 호출됨");

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
});

app.use('/', router);

var errorHandler = expressErrorHandler({
    static:{
    '404':'./public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

http.createServer(app).listen(app.get('port'), function(){
    console.log('서버가 시작되었습니다. 포트 :' + app.get('port'));
    connectDB();
});


//몽고디비 모듈 사용
var MongoClient = require('mongodb').MongoClient;
var database;
function connectDB(){
    var databaseUrl = 'mongodb://localhost:27017/local';
    MongoClient.connect(databaseUrl, function(err,db){
        if(err) throw err;

        console.log('데이터베이스에 연결되었습니다. :' + databaseUrl);
        //database 변수에 할당
        database = db;
    });
}

var authUser = function(database, id, password, callback){
    console.log('authuser 호출됨');
    
    //users 컬렉션 참조
    var users = database.collection('users');

    //아이디와 비번을 조회하여 콜백함수 적용
    users.find({"id":id, "password":password}).toArray(function(err,docs){
        if(err){
            callback(err,null);
            return;
        }
        if(docs.length > 0){
            callback(null,docs);
        }else{
            console.log('일치하는 사용자를 찾지 못함');
            callback(null,null);
        }
    });
}

app.post('/process/login', function(req, res){
    console.log("/process/login이 호출됨");

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;

    if(database){
        authUser(database, paramId, paramPassword, function(err,docs){
            if(err) {throw err;}
            if(docs){
                console.dir(docs);
                var username = docs[0].name;
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h1>로그인성공<h1>');
                res.write('<div><p>사용자아이디:' + paramId + '</p></div>');
                res.write('<div><p>사용자이름:' + username + '</p></div>');
                res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
                res.end();
            }else{
            res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
            res.write('<h1>로그인실패<h1>');
            res.write('<div><p>아이디와 비밀번호를 다시한번 확인해주세요.</p></div>');
            res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
            res.end();
            }
        });
    }else{
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패<h2>');
        res.end();
    }
});

