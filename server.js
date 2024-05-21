const express = require('express')
const app = express()

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))
app.set('view engine', 'ejs')

app.use(express.static('public'))

const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.get('/cookie', function (req, res) {
    res.cookie('milk', '1000원', {maxAge:1000})
    res.send('product:' + req.cookies.milk)
})

const session = require('express-session')
app.use(session({
    secret: 'jes',
    resave: false,
    saveUninitialized:false,
}))
app.get('/session', function (req, res) {
    if (isNaN(req.session.milk)) {
        req.session.milk=0
    }
    req.session.milk = req.session.milk + 1000;
    res.send(`session: ${req.session.milk}원`)
})

// MySQL 접속
// const mysql = require('mysql')
// const conn = mysql.createConnection({
//     host: 'localhost',
//     user: 'ssafy',
//     password: 'ssafy',
//     database:'jesdb'
// })
// conn.connect()

// MongoDB접속
const mongoclient = require('mongodb').MongoClient
const url = 'mongodb+srv://admin:1234@cluster0.tw4yyh6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

let mydb;
mongoclient
    .connect(url)
    .then(client => {
        console.log('몽고 DB 접속 성공')
        mydb = client.db('myboard')
        // mydb.collection('post').find().toArray()
        //     .then(result => {
        //         console.log(result)
        //     })

        app.listen(8080, function () {
            console.log('server ready...')
        })
    })
    .catch(err => {
        console.log(err)
    })



app.get('/', function (req, res) {
    res.render('index.ejs')
})

app.get('/book', function (req, res) { 
    res.send('도서 목록 관련 페이지입니다');
})

app.get('/enter', function (req, res) {
    res.render('enter.ejs')
})

app.post('/save', function (req,res) {
    //console.log(req.body.title)
    //console.log(req.body.content)
    // let sql = "insert into post (title, content, created) values(?,?,now())"
    // let params = [req.body.title, req.body.content]
    // conn.query(sql, params, function (err, result) {
    //     if (err) throw err;
    //     console.log('데이터 추가 성공')
    // })

    mydb.collection('post')
        .insertOne({title:req.body.title, content:req.body.content, date:new Date()})
        .then(result => {
            //console.log(result)
            //console.log('데이터 추가 성공')
            res.redirect('/list')
        })
        .catch(err => {
        console.log(err)
    })
    
    
})

app.get('/list', function (req, res) {
    // let sql = 'select * from post'
    // let params = []
    // conn.query(sql, params, function (err, rows, fields) {
    //     if (err) throw err;
    //     console.log(rows)
    //     res.render('list.ejs', {data:rows})
    // })   
   
    mydb.collection('post')
        .find()
        .toArray()
        .then(result => {
            //console.log(result)
            res.render('list.ejs', { data: result })
        })
        .catch(err => {
        console.log(err)
        })
    
    })


const ObjId=require('mongodb').ObjectId
app.post('/delete', function (req, res) {
    //console.log(req.body.no)
    // let sql = `delete from post where no=?`
    // let params = [req.body.no]
    // conn.query(sql, params, function (err, result) {
    //     if (err) throw err;
    //     console.log(result)
    //     res.status(200).send()
    // })

    //console.log(req.body._id)
    req.body._id=new ObjId(req.body._id)
    mydb.collection('post').deleteOne(req.body)
        .then(result => {
            //console.log('삭제완료')
            res.status(200).send()
        })
        .catch(err => {
            console.log(err)
            res.status(500).send()
    })
})

app.get('/content/:id', function (req, res) {
    //console.log(req.params.id)
    req.params.id = new ObjId(req.params.id)
    mydb.collection('post').findOne({ _id: req.params.id })
        .then(result => {
            //console.log(result)
            res.render('content.ejs', {data:result})
        })
        .catch()    
})

app.get('/edit/:id', function (req, res) {
    //console.log(req.params.id)
    req.params.id = new ObjId(req.params.id)
    mydb.collection('post')
        .findOne({ _id: req.params.id })
        .then(result => {
            console.log('글 가져오기 ',result)
            res.render('edit.ejs', {data:result})
    })
    
})

app.post('/edit', function (req, res) {
    console.log(req.body)
    req.body.id = new ObjId(req.body.id)
    console.log(req.body)
    mydb.collection('post')
        .updateOne({ _id: req.body.id }, { $set: { title: req.body.title, content: req.body.content, date: req.body.date } })
        .then(result => {
            console.log('수정완료')
            res.redirect('/list')
        }).catch(err => {
        console.log(err)
    })
})

app.get('/login', function (req, res) {
    if (req.session.user) {
        res.render('index.ejs')
    } else {
        res.render('login.ejs', { data: {} })
    }
    
})

app.post('/login', function (req, res) {
    console.log('아이디 : ' + req.body.userid)
    console.log('비밀번호 : ' + req.body.userpw)

    mydb.collection('account').findOne({ userid: req.body.userid })
        .then(result => {
            if (result.userpw == req.body.userpw) {
                req.session.user = req.body;                
                res.render('index.ejs',{user:req.session.user})
            } else {
                res.send('비밀번호가 틀렸습니다')
        }
        }).catch(err => {
            console.log(err)
            res.render('login.ejs',{data:{msg:'다시 로그인 해 주세요'}})
    })   
    
}) 

app.get('/logout', function (req, res) {
    req.session.destroy()
    res.render('index.ejs', { })
}) 