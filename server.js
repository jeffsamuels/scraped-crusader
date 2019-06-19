var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = 3000
var app = express();
var exphbs = require("handlebars")
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mlbPopulater";
mongoose.connect(MONGODB_URI);


app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("views"));

/// "/scrape" doesn't appear to be properly scraping from mlb.com

app.get("/scrape", function (req, res) {
    axios.get("https://www.mlb.com/").then(function (response) {
        var $ = cheerio.load(response.data);
        $("li div").each(function (i, element) {
            var result = {};
            result.title = $(this)
                .children("a")
                .text()
            result.link = $(this)
                .children("a")
                .attr("href");

/// Node error says db.Article.create is not a function 
/// despite the fact that I think I copied it as is from lesson 20

             db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {

                    console.log(err);
                });
        });
        res.send("Scrape Complete");
    });
});
app.get("/articles", function (req, res) {
    db.Article.find()
        .then(function (articles) {
            res.json(articles);
        })
        .catch(function (err) {
            res.json(err);
        });
});

/// I couldn't even get the version of /articles/:id to work in the classRepo version.

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("comment")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});
app.post("/articles/:id", function (req, res) {
    db.Comment.create(req.body)
        .then(function (dbComment) {
            return db.Article.findOneAndUpdate({ _id: req.params.id },
                { $push: { comment: dbComment._id } },
                { new: true });
        })
        .then(function (article) {
        
            res.json(article);
        })
        .catch(function (err) {
          
            res.json(err);
        });
});
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});