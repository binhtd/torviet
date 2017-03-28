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
    data: []
};

// scraper function
function scrape() {
    casper.echo('Scraping page ' + state.page + '...', 'INFO');

    var torrentRows = casper.evaluate(function(){
        return [].slice.call(document.querySelectorAll("div#idtorrent table.torrents tr"), 1);
    });

    utils.dump(torrentRows);
    casper.each(torrentRows, function(casper, torrentRow){
        state.data = state.data.concat(function(){
            var a = torrentRow.querySelector("td:nth-child(2) table.torrentname td:nth-child(1) a:nth-child(1)"),
                filmDetailPage = a.getAttribute('href'),
                filmName = a.getAttribute('title');
                genres = [].slice.call(torrentRow.querySelector("td:nth-child(2) table.torrentname td:nth-child(1) a"), 1),
                filmGenre = [],
                torrentDownloadLinkElement = torrentRow.querySelector("td:nth-child(2) table.torrentname td:nth-child(2) a:nth-child(1)"),
                torrentDownloadLinkUrl = torrentDownloadLinkElement.getAttribute('href'),
                totalCommentElement = torrentRow.querySelector("td:nth-child(3) a:nth-child(1)"),
                totalComment = this.stripHtmlTag(totalCommentElement.innerText),
                filmSizeElement = torrentRow.querySelector("td:nth-child(4)"),
                filmSize = this.stripHtmlTag(filmSizeElement.innerText),
                numberOfSeederElement = torrentRow.querySelector("td:nth-child(5)"),
                numberOfSeeder = this.stripHtmlTag(numberOfSeederElement.innerText),
                numberOfLeecherElement = torrentRow.querySelector("td:nth-child(6)"),
                numberOfLeecher = this.stripHtmlTag(numberOfLeecherElement.innerText),
                numberOfSnatchedElement = torrentRow.querySelector("td:nth-child(7)"),
                numberOfSnatched = this.stripHtmlTag(numberOfSnatchedElement.innerText),
                uploaderUserNameElement = torrentRow.querySelector("td:nth-child(8)"),
                uploaderUserName = this.stripHtmlTag(uploaderUserNameElement.innerText);

            for (var i=0; i<genres.length; i++){
                filmGenre.push(genres[i].innerText);
            }

            return [
                {
                   "filmDetailPage" : filmDetailPage,
                   "filmName" : filmName,
                   "filmGenre" : filmGenre,
                   "torrentDownloadLinkUrl" : torrentDownloadLinkUrl,
                   "totalComment" : totalComment,
                   "filmSize" : filmSize,
                   "numberOfSeeder" : numberOfSeeder,
                   "numberOfLeecher" : numberOfLeecher,
                   "numberOfSnatched" : numberOfSnatched,
                   "uploaderUserName" : uploaderUserName
                }
            ];
        });
    });

    utils.dump(state.data);

    casper.echo("caputure image " + state.torrentType["torrentType"] + "-page-" + state.page + ".png");
    casper.capture("torrent-list" + state.torrentType["torrentType"] + "-page-" + state.page + ".png");

    state.data = state.data.concat(function(){
        casper.each(torrentRows, function(casper, torrentRow){
            torrentRow
        });
        casper.echo("caputure image " + state.torrentType["torrentType"] + "-page-" + state.page + ".png");
        casper.capture("torrent-list" + state.torrentType["torrentType"] + "-page-" + state.page + ".png");
        return [];
    });

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