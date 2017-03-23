var x = require('casper').selectXPath,
    fs = require('fs'),
    utils = require('utils'),
    url = 'http://torviet.com/',
    typeOfTorrents = ["Movie", "TV", "Music"],
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


casper.thenOpen(url + "torrents.php", function(){
    current = 0;
    end = typeOfTorrents.length;
    for (;current < end;) {
        (function (cntr, torrentType) {
            this.echo("Torrenttype:" + torrentType);
            this.clickLabel(torrentType);
            this.wait(5000);
            casper.then(function(){
                this.echo("capture image");
                this.capture("torrent-list-" + torrentType + ".png");
            });


        })(current, typeOfTorrents[current]);
        current++;
    }
});

//casper.then(function(){
//    var linkCount = this.getElementsInfo("table.torrents tr table.torrentname td:nth-child(1) a:nth-child(1)").length;
//})

casper.run();