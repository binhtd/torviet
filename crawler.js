var x = require('casper').selectXPath,
    fs = require('fs'),
    utils = require('utils'),
    url = 'http://torviet.com/',
    typeOfTorrents = [
                        {
                            "torrentType": "Movie",
                            "torrentCategoryID": 2
                        },
                        {
                            "torrentType": "TV",
                            "torrentCategoryID": 3
                        },
                        {
                            "torrentType": "Music",
                            "torrentCategoryID": 5
                        },
                      ],
    loginUserName = "namthienmenh",
    loginPassword = "mlopqedc";

var casper = require("casper").create({
    verbose: true,
    logLevel: "debug",
    waitTimeout: 300000000,
    stepTimeout: 300000000,
    pageSettings: {
        loadImages: false,
        loadPlugins: false,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
    }
});

//casper.on("resource.requested", function(requestData, networkRequest){
//    var skip = [
//        'facebook.com',
//    ];
//
//    casper.each(skip, function(self, needle) {
//        if (requestData.url.indexOf(needle) > 0) {
//            networkRequest.abort();
//        }
//    });
//});

casper.renderJSON = function (what) {
    return this.echo(JSON.stringify(what, null, '  '));
};

casper.saveJSON = function (what) {
    var oldParseResult = [];

    if (fs.exists("json/parse_result.json")){
        oldParseResult = require("json/parse_result.json");

        if (utils.isArray(oldParseResult) && !utils.isNull(oldParseResult) && utils.isArray(what)){
            what = what.concat(oldParseResult);
        }
    }

    fs.write('json/parse_result.json', JSON.stringify(what, null, '  '), 'w');
};

casper.getRandomInt = function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


casper.formatString = function (containBetweenHtmlTag) {
    containBetweenHtmlTag = containBetweenHtmlTag.replace(/(\r\n|\n|\r)/gm, "");
    containBetweenHtmlTag = containBetweenHtmlTag.replace(/\s+/gm, " ");
    containBetweenHtmlTag = containBetweenHtmlTag.trim();

    return containBetweenHtmlTag;
};

casper.stripHtmlTag = function(str){
    return body.replace(/(<([^>]+)>)/ig, "");
};

casper.start();

// scraper state
var state = {
    page: 0,
    torrentType: [],
    data: [],
    length : 0
};

// scraper function
function scrape() {
    casper.echo('Scraping page ' + state.page + '...', 'INFO');

    utils.dump( casper.evaluate(function() {
        var rows = document.querySelectorAll("table.torrents tr:not(:first-child)"), torrentRows = [], torrentNameElement,
            filmDetailPage = "", filmName = "",  rowNameElement = null, rowNameContent = "",
            imdMatches = null, imdNumber =0 ,
            totalVoteMatches = null, totalVote = 0,
            genreMatches = null, filmGenre = "",  torrentDownloadLinkElement =  null,
            torrentDownloadLinkUrl = "", totalCommentElement = null, totalComment = 0, timeAliveElement = null, timeAlive= "",
            filmSizeElement = null, filmSize = 0, numberOfSeederElement = null, numberOfSeeder = 0, numberOfLeecherElement = null,
            numberOfLeecher = 0, numberOfSnatchedElement = null, numberOfSnatched = 0,
            uploaderUserNameElement = null, uploaderUserName = "";


        for(var i= 0, row; row=rows[i]; i++){
            torrentNameElement = row.querySelector("td:nth-child(2) table.torrentname td:nth-child(1) a:nth-child(1)");
            filmDetailPage = torrentNameElement.getAttribute('href');
            filmName = torrentNameElement.getAttribute('title');
            rowNameElement = row.querySelector("td:nth-child(2) table.torrentname td:nth-child(1)");
            rowNameContent = rowNameElement.innerText;
            imdMatches = /.+?<img.+?>(.+)\(.+votes.+/.exec(rowNameElement.innerText);
            totalVoteMatches = /.+\((.+?)votes\).+/.exec(rowNameElement.innerText);
            genreMatches = /.+?Genres:(.+)/.exec(rowNameElement.innerText);
            torrentDownloadLinkElement = row.querySelector("td:nth-child(2) table.torrentname td:nth-child(2) a:nth-child(1)");
            torrentDownloadLinkUrl = torrentDownloadLinkElement.getAttribute('href');
            totalCommentElement = row.querySelector("td:nth-child(3) a:nth-child(1)");
            totalComment = totalCommentElement.innerText;
            timeAliveElement = row.querySelector("td:nth-child(4)");
            timeAlive = timeAliveElement.innerText;
            filmSizeElement = row.querySelector("td:nth-child(5)");
            filmSize = filmSizeElement.innerText;
            numberOfSeederElement = row.querySelector("td:nth-child(6)");
            numberOfSeeder = numberOfSeederElement.innerText;
            numberOfLeecherElement = row.querySelector("td:nth-child(7)");
            numberOfLeecher = numberOfLeecherElement.innerText;
            numberOfSnatchedElement = row.querySelector("td:nth-child(8)");
            numberOfSnatched = numberOfSnatchedElement.innerText;
            uploaderUserNameElement = row.querySelector("td:nth-child(9)");
            uploaderUserName = uploaderUserNameElement.innerText;

            if (( imdMatches !=null) && (imdMatches.length > 1)){
                imdNumber = imdMatches[1];
            }

            if (( totalVoteMatches !=null) && (totalVoteMatches.length > 1)){
                totalVote = totalVoteMatches[1];
            }

            if (( genreMatches !=null) && (genreMatches.length > 1)){
                filmGenre = genreMatches[1];
            }

            torrentRows.push([
                {
                    "filmDetailPage" : filmDetailPage,
                    "filmName" : filmName,
                    "rowNameContent" : rowNameContent,
                    "imdNumber" : imdNumber,
                    "totalVote" : totalVote,
                    "filmGenre" : filmGenre,
                    "torrentDownloadLinkUrl" : torrentDownloadLinkUrl,
                    "totalComment" : totalComment,
                    "timeAlive" : timeAlive,
                    "filmSize" : filmSize,
                    "numberOfSeeder" : numberOfSeeder,
                    "numberOfLeecher" : numberOfLeecher,
                    "numberOfSnatched" : numberOfSnatched,
                    "uploaderUserName" : uploaderUserName
                }
            ]);
        };

        return torrentRows;
    })
    );

    //utils.dump(state.data);



    casper.echo("caputure image " + state.torrentType["torrentType"] + "-page-" + state.page + ".png");
    casper.capture("torrent-list" + state.torrentType["torrentType"] + "-page-" + state.page + ".png");


    var notHasMoreData = casper.evaluate(function() {
        var notHasMoreData = document.querySelector("font.gray b[title='Alt+Pagedown']");
        return notHasMoreData;
    });

    //if (!notHasMoreData) {
    //    state.page = state.page + 1;
    //    casper.thenOpen(url + "torrents_ajax.php?inclbookmarked=0&sltCategory=" + state.torrentType["torrentCategoryID"] + "&incldead=1&spstate=0&page=" + state.page,
    //        scrape);
    //}
};


//set input data
casper.thenOpen(url, function(){
    this.capture('login-form.png');
    this.sendKeys("input[name='username']", loginUserName);
    this.sendKeys("input[name='password']", loginPassword);

    this.click("input[type='submit']");
    this.waitWhileVisible('a[href="/torrents.php"]', function(){
        this.capture('after-login.png');
    });
});

casper.thenOpen(url + "torrents.php");

casper.each(typeOfTorrents, function(casper, torrentType){
  state.torrentType =  torrentType;
  casper.thenOpen(url + "torrents_ajax.php?inclbookmarked=0&sltCategory=" + torrentType["torrentCategoryID"] + "&incldead=1&spstate=0&page=" + state.page,
      scrape);
});


//casper.then(function(){
//    var linkCount = this.getElementsInfo("table.torrents tr table.torrentname td:nth-child(1) a:nth-child(1)").length;
//})



//casper.thenOpen(url + "torrents.php#sltCategory=2", function () {
//    this.waitForSelectorTextChange("div#idtorrent table.torrents", function(){
//        casper.capture("torrent-list-" + "Movie" + ".png");
//    });
//});
//
//casper.thenOpen(url + "torrents.php#sltCategory=3", function () {
//    this.waitForSelectorTextChange("div#idtorrent table.torrents", function(){
//        casper.capture("torrent-list-" + "TV" + ".png");
//    });
//
//});
//
//casper.thenOpen(url + "torrents.php#sltCategory=5", function () {
//    this.waitForSelectorTextChange("div#idtorrent table.torrents", function(){
//        casper.capture("torrent-list-" + "Music" + ".png");
//    });
//
//});

casper.run();