const express = require('express');

const app = express();

const mysql = require('mysql');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const uuid = require('uuid');
const http = require("http").createServer(app);
const io = require('socket.io')(http);



require('dotenv').config()
// app.use(session({select: 'takenoko'}));
//
// app.use(passport.initialize());//Expressを使用している場合はInitializeが必要
//
// app.use(passport.session())//session()定義後に書く

app.use(express.static('public'));//publicフォルダの読み込み

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.use(express.urlencoded({extended: true}));//フォームを使うため

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'cocochan2480',
  database: 'list'
});//mysqlのクエリを使うための準備

connection.connect((err) => {
  if (err) {
    console.log('error connecting: ' + err.stack);
    return;
  }
  console.log('success');
});//mysqlに接続できなかった時の処理

app.set('view engine', 'ejs');//ejsの準備


/////////////メール/////////////
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});



////////////メール/////////////

// passport.use(new LocalStrategy({
//     userNameField:'username',
//     passwordField:'password',
//     passReqToCallback: true
// },function(req, username, password, done){
//     process.nextTick(function(){
//     //処理書く
//       　//ユーザ名、パスワード不正時の処理を記述する
//         if(!username){
//             return done(null, false, { message: 'Username is incorrect' })
//         //↓にはPasswordチェック処理を実装してください。
//         } else if(password !== result[0].password){
//             return done(null, false, { message: 'Username is incorrect' })
//         } else{
//             console.log("username"+username)
//             return done(null, username);
//         }
//     })
// }));


app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/user');
  } else {
    res.render('top.ejs', {
      title: 'ログインページ',
      noUser: noUser
    });
    noUser = undefined;
  }
});//パスに来たリクエストにコールバック関数で返す

app.get('/user', (req, res) => {
  connection.query(
    'SELECT * FROM users WHERE user_id = ?',
    [req.session.user_id],
    (error, results) => {
      res.render('user.ejs', {
        title: 'MEMO',
        userName: req.session.userName
      });
      console.log(results[0].user_name);
    }
  );
});

app.get('/logout', (req, res) => {
  req.session.user_id = undefined;
  res.redirect('/');
  console.log('セッションを破棄しました');
});


app.post('/create', (req, res) => {
  connection.query(
    'INSERT INTO items (name) VALUES(?)',
    [req.body.itemName],
    (error, results) => {
      res.redirect('/');
    }
  );
});//新規作成

app.post('/delete/:id', (req, res) => {
  connection.query(
    'DELETE FROM items WHERE id = ?',
    [req.params.id],
    (error, results) => {
      res.redirect('/');
    }
  );
});//削除

app.post('/edit/:id', (req, res) => {
  connection.query(
    'UPDATE items SET name = ? WHERE id = ?',
    [req.body.itemName, req.params.id],
    (error, results) => {
      res.redirect('/');
    }
  );
});//編集






/////////////新規登録//////////////
app.get('/register', (req, res) => {
  res.render('register.ejs', {
    title: '新規登録'
  });
});

app.post('/register', (req, res) => {
  let user_name = req.body.user_name;
  let email = req.body.email;
  let uuidv4 = uuid.v4();
  let pass = req.body.pass;
  let pass_check1 = req.body.pass_check;
  let hash = bcrypt.hashSync(pass, 10);
  connection.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email],
    (error, results) => {
      if (results.length) {
        res.render('register.ejs', {
          title: '新規登録',
          emailExists: '※既に登録されているメールアドレスです'
        });
      } else {
        if (pass == pass_check1) {
          let data = {
            from: 'xishanzhangliu@gmail.com',
            to: email,
            html: 'ここから本登録して下せえ<br>http://localhost:3000/confirm/'+uuidv4,
            subject: '仮登録完了',
          };
          connection.query(
            'INSERT INTO tmp_table (user_name, email, uuid, pass) VALUES(?, ?, ?, ?)',
            [user_name, email, uuidv4, hash],
            (error, results) => {
              transporter.sendMail(data, (error, info) => {
                if(error) {
                  console.log(error); // エラー情報
                } else {
                  console.log(info);  // 送信したメールの情報
                }
              });
              res.render('register-twice.ejs');
            }
          );
        } else {
          res.redirect('/register');
        }
      }
    }
  );
});


/////////////新規登録//////////////
//////////////本登録//////////////




app.get('/confirm/:uuid', (req, res) => {
  let created_at = new Date();
  connection.query(
    'SELECT * FROM tmp_table WHERE uuid = ?',
    [req.params.uuid],
    (error, results) => {
      let user_id = results.length? results[0].user_id: false;
      let user_name = results[0].user_name;
      connection.query(
        'INSERT INTO users (user_name, email, created_at, pass) VALUES(?, ?, ?, ?)',
        [results[0].user_name, results[0].email, created_at, results[0].pass],
        (error, results) => {
          req.session.user_id = user_id;
          req.session.userName = user_name;
          res.redirect('/user');
          connection.query(
            'DELETE FROM tmp_table WHERE uuid = ?',
            [req.params.uuid]
          )
        }
      )
    }
  )
});











//////////////本登録//////////////
////////////ログイン//////////////
let noUser;

app.post('/rogin', (req, res) => {
  let email = req.body.email;
  let pass = req.body.pass;
  connection.query(
    'SELECT * FROM users WHERE email = ?LIMIT 1',
    [email],
    (error, results) => {
      let user_id = results.length? results[0].user_id: false;
      if (user_id) {
        let hash_compare = bcrypt.compareSync(pass, results[0].pass);
        if (hash_compare) {
          req.session.user_id = user_id;
          req.session.userName = results[0].user_name;
          res.redirect('/user');
          console.log('Login success');
          console.log('id : '+results[0].user_id+' pass : '+results[0].pass+' email : '+results[0].email);
        }else {
          noUser = '※メールアドレスとパスワードが一致するユーザーはいません',
          res.redirect('/');
          console.log('Login failed');
        }
      } else {
        noUser = '※メールアドレスとパスワードが一致するユーザーはいません',
        res.redirect('/');
        console.log('Login failed');
      }
    }
  );
});





////////////ログイン//////////////


///////////スレッド///////////////

app.post('/createThread', (req, res) => {
  let title = req.body.title;
  let category = req.body.category;
  let createdAt = new Date();
  let owner = req.session.userName;
  connection.query(
    'INSERT INTO threads (title, category, created_at, owner) VALUES(?, ?, ?, ?)',
    [title, category, createdAt, owner],
    (error, results) => {
      res.redirect('/user')
      console.log("スレッドを作成しました");
      console.log(owner);
    }

  )
});



app.get('/threadPage/:id', (req, res) => {
  let id = req.params.id;
  console.log('ok');
  connection.query(
    'SELECT * FROM threads WHERE thread_id = ?',
    [id],
    (error, results) => {
      connection.query(
        'SELECT * FROM res WHERE thread_id = ?',
        [id],
        (error, results_a) => {
          console.log('ok'+results[0].title);
          res.render('page.ejs', {
            title: results[0].title,
            thread: results[0],
            reses: results_a
          });
          console.log('ok3'+results[0].owner);

        }
      )
    }
  );
});


app.get('/list', (req, res) => {
  connection.query(
    'SELECT * FROM threads',
    (error, results) => {
      res.render('thread-li.ejs', {
        threads: results
      });
    }
  );
});
///////////スレッド///////////////
////////////レス/////////////////

app.post('/res/:id', (req, res) => {
  let text = req.body.res;
  let userName = req.session.userName;
  let threadId = req.params.id;
  let createdAt = new Date();
  connection.query(
    'INSERT INTO res (res_text, user_name, thread_id, created_at) VALUE(?, ?, ?, ?)',
    [text, userName, threadId, createdAt],
    (error, results) => {
      res.redirect('/threadPage/'+threadId);
    }
  )
});

////////////レス/////////////////
/////////////ソケット////////////

var sessionMiddleware = session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false,
  cookie:{
  httpOnly: false,
  secure: false,
  maxage: 1000 * 60 * 30
}});
app.session = sessionMiddleware;
app.use(sessionMiddleware);


io.use(function(socket, next){
  sessionMiddleware(socket.request, socket.request.res, next);
});

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました');

  socket.on('post', (msg) => {
    let userName = socket.request.session.username;
    let createdAt = new Date();
    connection.query(
      'INSERT INTO chat (text, user_name, created_at) VALUE(?, ?, ?)',
      [msg.text, userName, createdAt],
      (error, results) => {
        connection.query(
          'SELECT * FROM chat ORDER BY id DESC',
          (error, results2) => {
            io.emit('member-post', results2[0]);
          }
        )

      }
    )

    io.emit('member-post', );
  });



});
/////////////ソケット////////////
/////////////チャット////////////
app.get('/chat', (req, res) => {
  connection.query(
    'SELECT * FROM chat',
    (error, results) => {
      res.render('chat.ejs', {
        title: 'チャット',
        chatLog: results
      });
    }
  );
});
/////////////チャット////////////



//サーバーの起動
http.listen(3000, ()=>{
  console.log("listening on *:3000");
});
