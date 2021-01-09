// const mysql = require('mysql');
//
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'cocochan2480',
//   database: 'list'
// });
// 
// connection.connect((err) => {
//   if (err) {
//     console.log('error connecting: ' + err.stack);
//     return;
//   }
//   console.log('success');
// });
//
// module.exports = {
//   getList: () => {
//     connection.query(
//       'SELECT * FROM items',
//       (error, results) => {
//         res.render('top.ejs', {items: results})
//       }
//     );
//   }
// };
