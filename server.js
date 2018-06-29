'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var validUrl = require('valid-url');
var cors = require('cors');

var app = express();
app.use(cors());//I don't know this
// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on('connected', () => {
	console.log(`Connected to database`);
});
var Schema = mongoose.Schema;
var shortUrlSchema = new Schema({
  originalUrl: String,
  shortUrl: Number
});
var ShortUrl = mongoose.model("ShortUrl",shortUrlSchema);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});
app.route("/api/shorturl/new").post(function(req,res){
  //console.log(req);
  let url = req.body.url;
  if (validUrl.isUri(url)){
    console.log("good");
    ShortUrl.findOne({originalUrl: url},function(err,data){
      if (data){//already exist, just return the record
        res.json({original_url: data.originalUrl, short_url: data.shortUrl});
      }
      else {//new url, need to save to DB
        ShortUrl.count({},function(err,data){
          let short = data + 1;
          let newDocument = new ShortUrl({
            originalUrl: url,
            shortUrl: short
          });
          newDocument.save(function(err){
            if(err) console.log(err);
          });
          res.json({original_url: url, short_url: short});
        });
      }
    });
  }
  else {
    res.json({error:"invalid URL"});;
  }
  //res.json({input: req.body.url});
});
app.get("/:shortUrl",function(req,res){
  ShortUrl.findOne({shortUrl: req.params.shortUrl},function(err,data){
    if (data){
      res.redirect(data.originalUrl);
    }
    else {
      res.send("No such short Url!");
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...',port);
});
