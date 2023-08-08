module.exports = function(app, shopData) {

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId ) {
        res.redirect('./login')
        } else { next (); }
        }

    const { check, validationResult } = require('express-validator');

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });
    app.get('/search',redirectLogin,function(req,res){
        res.render("search.ejs", shopData);
    });
    app.get('/deleteuser',function(req,res){
        let sqlquery = "SELECT * FROM user_details"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableusers:result});
            console.log(newData);
            res.render("deleteuser.ejs", newData);
         });
        //res.render("deleteuser.ejs", shopData);
    });
    app.get('/search-result',[check('keyword').notEmpty().isAlphanumeric()], 
    function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        res.redirect('./'); }
        else {
            //searching in the database
            //res.send("You searched for: " + req.query.keyword);

            let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.sanitize(req.query.keyword) + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./'); 
                }
                let newData = Object.assign({}, shopData, {availableBooks:result});
                console.log(newData);
                res.render("list.ejs", newData);
            });
        
        }
                
    });
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });

    app.get('/login', function (req,res) {
        res.render('login.ejs', shopData);                                                                     
    });
    app.get('/weather', function (req,res) {
        
        res.render('weather.ejs', shopData);                                                                     
    });
    app.get('/tvshow', function (req,res) {
        
        res.render('tvshow.ejs', shopData);                                                                     
    });
    app.get('/tvshow-result',function (req, res) {
        const request = require('request');
        
        let user_search = req.query.tvshow_keyword;
        let url = `https://api.tvmaze.com/search/shows?q=${user_search}`
        request(url, function (err, response, body) {
            if(err){
                console.log('error:', error);
            } else {
                
                var tvshow_data = JSON.parse(body);

                // ///////////////////////////////////////////
                if (tvshow_data.length !== 0) {

                    let newData = Object.assign({}, shopData, {availabletvshowdata:tvshow_data});
                    res.render("tvshow.ejs", newData);
                }
                else{
                    res.render("tvshow.ejs", shopData);
                }
                // ////////////////////////////////////////////
            }
        });
                
    });
    app.get('/weather-result',function (req, res) {
        var our_word = req.query.weather_keyword;
        const request = require('request');
        let apiKey = 'a5dae4614b8c7c6c19cd8699e1578d4f';
        let city = our_word;
        let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        request(url, function (err, response, body) {
            if(err){
                console.log('error:', error);
            } else {
                // res.send(body);
                var weather = JSON.parse(body);
                if (weather!==undefined && weather.main!==undefined) {
                    // var wmsg = 'It is '+ weather.main.temp +
                    // ' degrees in '+ weather.name +
                    // '! <br> The humidity now is: ' +
                    // weather.main.humidity;
                    // res.send(wmsg);
                    var result= [{stringdata:'temperature is ',actualdata:weather.main.temp},
                                {stringdata:'humidity is ',actualdata:weather.main.humidity},
                                {stringdata:'pressure is ',actualdata:weather.main.pressure},
                                {stringdata:'wind speed is ',actualdata:weather.wind.speed}];

                    let newData = Object.assign({}, shopData, {availableweatherdata:result});
                    res.render("weather.ejs", newData);
                }
                else{
                    res.render("weather.ejs", shopData);
                }
            }
        });
                
    });

    app.get('/api', function (req,res) {
        // Query database to get all the books
        if(typeof req.query.keyword !== 'undefined'){

            let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./'); 
                }
                res.json(result);
            });
        }
        else{
            let sqlquery = "SELECT * FROM books";
            // Execute the sql query
            db.query(sqlquery, (err, result) => {
            if (err) {
            res.redirect('./');
            }
            // Return results as a JSON object
            res.json(result);
            });
        }
        
    });

    app.get('/logout', redirectLogin, (req,res) => {
        req.session.destroy(err => {
        if (err) {
        return res.redirect('./')
        }
        res.send('you are now logged out. <a href='+'./'+'>Home</a>');
        })
    });

    app.post("/deleteuser1", function (req, res) {

        //searching in the database
        let sqlquery = "DELETE FROM user_details WHERE id=?";
        
        // execute sql query
        let our_st = req.body.delete_user_selector;
        our_st = our_st.replace('id number ','');

        //passing our delete query to mysql server
        db.query(sqlquery,[parseInt(our_st)], (err, result) => {
        if (err) {
        console.log(err);
        }
        else{
            console.log("deleted sucessfully");
            res.redirect('./'); //and then finally redirecting back to home page
        }
        });
    });

    app.post('/loggedin', [check('user_name').isAlpha('en-US', {ignore: '\s'}).notEmpty(),
                           check('password').isLength({ min: 8 }).notEmpty()], 
    function (req,res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        res.redirect('./login'); }
        else {
                // saving data in database
                const bcrypt = require('bcrypt');

                // Compare the password supplied with the password in the database
                let sqlquery = 'SELECT hashedPassword FROM user_details WHERE username = ?';
                let our_l =[req.sanitize(req.body.user_name)];
    
                // //passing our insert query to mysql server
                db.query(sqlquery,our_l, (err, result) => {
                    if (err) {
                    console.log(err);
                    }
                    else{
                        console.log("query passed");
                        var hashedPassword = result[0].hashedPassword;
    
                        bcrypt.compare(req.sanitize(req.body.password), hashedPassword, function(err, rult) {
                            if (err) {
                            // TODO: Handle error
                                console.log(err);
                            }
                            else if (rult == true) {
                            // TODO: Send message
                            console.log("query passed again");
                            // Save user session here, when login is successful
                            req.session.userId = req.sanitize(req.body.user_name);
                            // console.log(req.session.userId);
                            //res.redirect('./index');
                            res.send('your password is correct, username: '+ req.sanitize(req.body.user_name));
                            }
                            else {
                            // TODO: Send message
                            console.log("query failed",req.sanitize(req.body.password));
                            res.send('your password is incorrect, password: '+ req.sanitize(req.body.password));
                            }
                        });
                        
                    }
                });

         
        }
        
        
    });

    app.post('/registered',[check('email').isEmail(),
                            check('password').isLength({ min: 8 }).notEmpty(),
                            check('user_name').isAlpha('en-US', {ignore: '\s'}).isLength({ min: 3 }).notEmpty()],
     function (req,res) {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.redirect('./register');
        }
        else {
        
            // saving data in database
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            const plainPassword = req.body.password;

            bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                // Store hashed password in your database.
                // console.log(req.body.user_name,req.body.first,req.body.last,hashedPassword,req.body.email);

                let sqlquery = "INSERT INTO user_details (username,first_name,last_name,hashedPassword,email) VALUES (?,?,?,?,?)";
                let our_l =[req.body.user_name,req.sanitize(req.body.first),req.sanitize(req.body.last),hashedPassword,req.body.email];

                // //passing our insert query to mysql server
                db.query(sqlquery,our_l, (err, result) => {
                    if (err) {
                    console.log(err);
                    }
                    else{
                        console.log("added sucessfully");
                        
                    }
                });

                result = 'Hello '+ req.sanitize(req.body.first) + ' '+ req.sanitize(req.body.last); 
                result += ' you are now registered! We will send an email to you at ' + req.sanitize(req.body.email);
                result += 'Your password is: '+ req.sanitize(req.body.password) +' and your hashed password is: '+ hashedPassword;
                res.send(result);

            });
            
            // res.send(' Hello '+ req.body.first + ' '+ req.body.last +' you are now registered!  We will send an email to you at ' + req.body.email);

        }

                                                                                      
    }); 

    app.get('/list',redirectLogin, function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData);
            res.render("list.ejs", newData);
         });
    });

    app.get('/listusers', function(req, res) {
        let sqlquery = "SELECT * FROM user_details"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableusers:result});
            //console.log(newData);
            res.render("listusers.ejs", newData);
         });
    });

    app.get('/addbook',redirectLogin, function (req, res) {
        res.render('addbook.ejs', shopData);
     });
 
    app.post('/bookadded',[check('name').notEmpty().isAlphanumeric(),
                           check('price').isNumeric().notEmpty()], 
    function (req,res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        res.redirect('./'); }
        else {
            // saving data in database
            let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
            // execute sql query
            let newrecord = [req.sanitize(req.body.name), req.sanitize(req.body.price)];
            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                return console.error(err.message);
                }
                else
                res.send(' This book is added to database, name: '+ req.sanitize(req.body.name) + ' price '+ req.sanitize(req.body.price));
            });
        }
        
    });    

       app.get('/bargainbooks',redirectLogin, function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render("bargains.ejs", newData)
        });
    });       

}
