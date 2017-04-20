var x = require('casper').selectXPath,
    fs = require('fs'),
    utils = require('utils'),
    url = 'http://torviet.com',
    typeOfTorrents = [
        {
            "torrentType": "Movie",
            "torrentCategoryID": 2
        }
        ,
        {
          "torrentType": "TV",
          "torrentCategoryID": 3
        },
        {
          "torrentType": "Music",
          "torrentCategoryID": 5
        }
    ],
    loginUserName = "namthienmenh",
    loginPassword = "mlopqedc";

var casper = require("casper").create({
    verbose: true,
    logLevel: "debug",
    waitTimeout: 300000000,
    stepTimeout: 300000000,
    pageSettings: {
        webSecurityEnabled: false,
        loadImages: false,
        loadPlugins: false,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
    }
});

// scraper state
var state = {
    "Movie" : [],
    "TV"    : [],
    "Music" : []
};


casper.on("resource.requested", function(requestData, networkRequest){
    var skip = [
        'facebook.com',
    ];

    casper.each(skip, function(self, needle) {
        if (requestData.url.indexOf(needle) > 0) {
            networkRequest.abort();
        }
    });
});

casper.on("resource.error", function(resourceError) {
    this.echo("Resource error: " + "Error code: "+resourceError.errorCode+" ErrorString: "+resourceError.errorString+" url: "+resourceError.url+" id: "+resourceError.id, "ERROR");
});

casper.renderJSON = function (what) {
    return this.echo(JSON.stringify(what, null, '  '));
};

casper.saveJSON = function (fileName, what) {
    fs.write(fileName, JSON.stringify(what, null, '  '));
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
    return str.replace(/(\r\n|\n|\r)/gm, "").replace(/<([^.]+)>.*?<\/\1>/igm, "");
};

casper.getQueryVariable = function (url, parameterName) {
    var pattern = new RegExp( parameterName + "=([0-9]+)" , "i"),
        matches = pattern.exec(url);

    if ( (matches !=null) && (matches.length > 1)){
        return matches[1];
    }

    return(false);
};

casper.createFolderHoldFilmFiles = function (filmName, torrentTypeName) {
    casper.echo("Created film folder:" + fs.workingDirectory + "/" + torrentTypeName+ "/" + filmName);
    fs.makeDirectory(fs.workingDirectory + "/" + torrentTypeName + "/" + filmName + "/");
};

casper.getTorrentFilePath = function (filmName, torrentTypeName){
    return  fs.workingDirectory + "/" + torrentTypeName + "/"  + filmName + "/" + filmName + ".torrent";
};

casper.DownloadTorrent = function (pageData, torrentTypeName){
    var filmName = "", torrentDownloadLinkUrl = "";
    for(var i=0; i < pageData.length; i++){
        filmName = pageData[i]["filmName"];
        torrentDownloadLinkUrl = pageData[i]["torrentDownloadLinkUrl"];
        casper.createFolderHoldFilmFiles(filmName, torrentTypeName);
        casper.download(url + torrentDownloadLinkUrl, casper.getTorrentFilePath(filmName, torrentTypeName));
    }
};

casper.getTorrentFilePathForPageData = function (data, torrentTypeName){
    var pageData = data;
    for(var i=0; i < pageData.length; i++){
        filmName = pageData[i]["filmName"];
        pageData[i]["torrentFullFilePath"] = casper.getTorrentFilePath(filmName, torrentTypeName);
    }

    return pageData;
};

casper.getTorrentTypeByTorrentCategoryID = function (torrentCategoryID){
    for (var i=0; i < typeOfTorrents.length; i++){
        if (typeOfTorrents[i]["torrentCategoryID"] == torrentCategoryID){
            return typeOfTorrents[i]["torrentType"];
        }
    }

    return "";
};

casper.getFilmDetailForPageData = function(data){
    var pageData = data, filmDetailPageContent = "";

    for(var i=0; i < pageData.length; i++) {

        (function(index){
            casper.thenOpen( url + pageData[index]["filmDetailPage"], function(){
                var filmInformation = (this.exists('#kimdb tr:nth-child(2) td"')  ? this.fetchText("#kimdb tr:nth-child(2) td") : "" ),
                    outerObject = (this.exists('#outer') ? this.getElementInfo('#outer') : null), outerContent = (!utils.isNull(outerObject) ? outerObject["html"] : ""),
                    kdescrObject = (this.exists('#kdescr') ? this.getElementInfo('#kdescr') : null), kdescrContent = (!utils.isNull(kdescrObject) ? kdescrObject["html"] : ""),
                    ktrailerObject = (this.exists('#ktrailer') ? this.getElementInfo('#ktrailer') : null), ktrailerContent = (!utils.isNull(ktrailerObject) ? ktrailerObject["html"] : ""),
                    kothercopyObject = (this.exists('#kothercopy table tr:not(:first-child)') ? this.getElementsInfo('#kothercopy table tr:not(:first-child)') : null),
                    kothercopy = [], kothercopyRow = "", kothercopyRowMatches = [], kothercopyRowLink = "", kothercopyRowFileSize = "", kothercopyRowTimeAdded = "",
                    ratingMatches = /.+?Rating:(.+?)\n/gmi.exec(filmInformation), rating = "",
                    languagesMatches = /.+?Language:(.+?)\n/gmi.exec(filmInformation), languages = "",
                    countryMatches = /.+?Country:(.+?)\n/gmi.exec(filmInformation), country = "",
                    runtimeMatches = /.+?Runtime:(.+?)\n/gmi.exec(filmInformation), runtime = "",
                    allGenresMatches = /.+?All Genres:(.+?)\n/gmi.exec(filmInformation), allGenres = "",
                    directorMatches = /.+?Director:(.+?)\n/gmi.exec(filmInformation), director = "",
                    writtenByMatches = /.+?Written By:(.+?)\n/gmi.exec(filmInformation), writtenBy = "",
                    castMatches = /.+?Cast:(.+?)\n/gmi.exec(filmInformation), cast = "",
                    techRuntimeMatches = /<li\s+class="infolabel"\s?>Runtime.+?class="infovalue"\s?>(.+?)</gmi.exec(outerContent), techRuntime = "",
                    techResolutionMatches = /<li\s+class="infolabel"\s?>Resolution.+?class="infovalue"\s?>(.+?)</gmi.exec(outerContent), techResolution = "",
                    techAudioMatches = /<li\s+class="infolabel"\s?>Audio.+?class="infovalue"\s?>(.+?)</gmi.exec(outerContent), techAudio = "",
                    techSubtitlesMatches = /<li\s+class="infolabel"\s?>Subtitles.+?class="infovalue"\s?>(.+?)</gmi.exec(outerContent), techSubtitles = "",
                    techBitrateMatches = /<li\s+class="infolabel"\s?>Bitrate.+?class="infovalue"\s?>(.+?)</gmi.exec(outerContent), techBitrate = "",
                    techFramerateMatches = /<li\s+class="infolabel"\s?>Framerate.+?class="infovalue"\s?>(.+?)</gmi.exec(outerContent), techFramerate = "",
                    techScanTypeMatches = /<li\s+class="infolabel"\s?>Scan type.+?class="infovalue"\s?>(.+?)</gmi.exec(outerContent), techScanType = "",
                    subtitleURLPattern = /(\/downloadsubs\.php.+?)"/gim, subtitleURLMatches = [], subtitleURLs = [],
                    imdbRefMatches = /iMDB:\s+?<a\s+href="(.+?)"/gmi.exec(kdescrContent), imdbRef = "",
                    ktrailerMatches = /<iframe.+?src="(.+?)".+?>/gmi.exec(ktrailerContent), trailerURL = "",
                    screenShotPattern = /<img.+?src="(.+?)"/gmi,  screenShotMatches = [], screenShots = [];


                if ( (ratingMatches!=null) && (ratingMatches.length > 1)){
                    rating = ratingMatches[1];
                }

                if ( (languagesMatches!=null) && (languagesMatches.length > 1)){
                    languages = languagesMatches[1];
                }

                if ( (countryMatches!=null) && (countryMatches.length > 1)){
                    country = countryMatches[1];
                }

                if ( (runtimeMatches!=null) && (runtimeMatches.length > 1)){
                    runtime = runtimeMatches[1];
                }

                if ( (allGenresMatches!=null) && (allGenresMatches.length > 1)){
                    allGenres = allGenresMatches[1];
                }

                if ( (directorMatches!=null) && (directorMatches.length > 1)){
                    director = directorMatches[1];
                }

                if ( (writtenByMatches!=null) && (writtenByMatches.length > 1)){
                    writtenBy = writtenByMatches[1];
                }

                if ( (castMatches!=null) && (castMatches.length > 1)){
                    cast = castMatches[1];
                }

                if ( (techRuntimeMatches!=null) && (techRuntimeMatches.length > 1)){
                    techRuntime = techRuntimeMatches[1];
                }

                if ( (techResolutionMatches!=null) && (techResolutionMatches.length > 1)){
                    techResolution = techResolutionMatches[1];
                }

                if ( (techAudioMatches!=null) && (techAudioMatches.length > 1)){
                    techAudio = techAudioMatches[1];
                }

                if ( (techSubtitlesMatches!=null) && (techSubtitlesMatches.length > 1)){
                    techSubtitles = techSubtitlesMatches[1];
                }

                if ( (techBitrateMatches!=null) && (techBitrateMatches.length > 1)){
                    techBitrate = techBitrateMatches[1];
                }

                if ( (techFramerateMatches!=null) && (techFramerateMatches.length > 1)){
                    techFramerate = techFramerateMatches[1];
                }

                if ( (techScanTypeMatches!=null) && (techScanTypeMatches.length > 1)){
                    techScanType = techScanTypeMatches[1];
                }


                while ( (subtitleURLMatches = subtitleURLPattern.exec(outerContent)) !== null) {
                    if (subtitleURLMatches.index === subtitleURLPattern.lastIndex) {
                        subtitleURLPattern.lastIndex++;
                    }

                    subtitleURLs.push(subtitleURLMatches[1]);
                }

                if ( (imdbRefMatches!=null) && (imdbRefMatches.length > 1)){
                    imdbRef = imdbRefMatches[1];
                }

                if ( (ktrailerMatches!=null) && (ktrailerMatches.length > 1)){
                    trailerURL = ktrailerMatches[1];
                }

                while ( (screenShotMatches = screenShotPattern.exec(kdescrContent)) !== null) {
                    if (screenShotMatches.index === screenShotPattern.lastIndex) {
                        screenShotPattern.lastIndex++;
                    }

                    screenShots.push(screenShotMatches[1]);
                }


                if (!utils.isNull(kothercopyObject)){
                    for(var i=0; i<kothercopyObject.length; i++){
                        kothercopyRow = kothercopyObject[i]["html"];
                        kothercopyRowMatches = /<td.+?<td.+?<a.+?href=\\?"(.+?)\\?"/gmi.exec(kothercopyRow);
                        kothercopyRowLink = "";

                        if ((kothercopyRowMatches!=null) && (kothercopyRowMatches.length > 1)){
                            kothercopyRowLink = kothercopyRowMatches[1];
                        }


                        kothercopyRowFileSize = "";
                        kothercopyRowMatches = /<td.+?<td.+?<td.+?<td.+?>(.+?)<\/td>/gmi.exec(kothercopyRow);
                        if ((kothercopyRowMatches!=null) && (kothercopyRowMatches.length > 1)){
                            kothercopyRowFileSize = kothercopyRowMatches[1];
                        }

                        kothercopyRowTimeAdded = "";
                        kothercopyRowMatches = /<td.+?<td.+?<td.+?<td.+?<td.+?>(<span.+?>)?(.+?)<\/td>/gmi.exec(kothercopyRow);
                        if ((kothercopyRowMatches!=null) && (kothercopyRowMatches.length > 2)){
                            kothercopyRowTimeAdded = kothercopyRowMatches[2];
                        }

                        kothercopy.push({
                            "url" : kothercopyRowLink,
                            "size" : kothercopyRowFileSize,
                            "timeAdded" : kothercopyRowTimeAdded
                        });
                    }
                }

                pageData[index]["filmDetailPageContent"] = {
                  "posterIMDB": (this.exists("#kimdb #posterimdb img") ? this.getElementAttribute("#kimdb #posterimdb img", "src") : ""),
                  "originLinkIMDB" : (this.exists("#kimdb tr:first-child td:nth-child(2) a") ? this.getElementAttribute("#kimdb tr:first-child td:nth-child(2) a", "href") : ""),
                  "rating" : rating,
                  "languages": languages,
                  "country" : country,
                  "runtime" : runtime,
                  "allGenres" : allGenres,
                  "director" : director,
                  "writtenBy" : writtenBy,
                  "cast" : cast,
                  "filmPlotOutline" : casper.stripHtmlTag( this.exists("#kimdb tr:nth-child(3) td") ? this.fetchText("#kimdb tr:nth-child(3) td").replace(/(\n|-)/g, "") : ""),
                  "technicalInformation" : {
                      "runtime" : techRuntime,
                      "resolution" : techResolution,
                      "audio" : techAudio,
                      "subtitles" : techSubtitles,
                      "bitrate" : techBitrate,
                      "Framerate" : techFramerate,
                      "scanType" : techScanType
                  },
                  "subtitleURLs": subtitleURLs,
                  "imdbRef" : imdbRef,
                  "trailerURL" : trailerURL,
                  "screenShots" : screenShots,
                  "otherCopy" : kothercopy
                };
            });
        })(i);
    }

    return pageData;
}

casper.start();

// scraper function
function scrape() {
    var  torrentTypeID = 0, currentURL = this.getCurrentUrl(),
        page = 0, pageData = [], torrentType = "";
    page = casper.getQueryVariable(currentURL, "page");
    page = page * 1;
    torrentTypeID = casper.getQueryVariable(currentURL, "sltCategory");
    torrentTypeID = torrentTypeID * 1;
    torrentTypeName = casper.getTorrentTypeByTorrentCategoryID(torrentTypeID);
    torrentTypeName = torrentTypeName + "";
    casper.echo("page:" + page + "-> sltCategory:" + torrentTypeID + " torrentType->" + torrentTypeName);

    pageData = casper.evaluate(function() {
            var rows = document.querySelectorAll(".torrents tr:not(:first-child)"), row = null,
            torrentRows = [], torrentNameElement = null,
            filmDetailPage = "", filmName = "",  rowNameElement = null, rowNameContent = "",
            imdMatches = null, imdNumber =0 ,
            totalVoteMatches = null, totalVote = 0,
            genreMatches = null, filmGenre = "",  torrentDownloadLinkElement =  null,
            torrentDownloadLinkUrl = "", totalCommentElement = null, totalComment = 0, timeAliveElement = null, timeAlive= "",
            filmSizeElement = null, filmSize = 0, numberOfSeederElement = null, numberOfSeeder = 0, numberOfLeecherElement = null,
            numberOfLeecher = 0, numberOfSnatchedElement = null, numberOfSnatched = 0,
            uploaderUserNameElement = null, uploaderUserName = "";

        for(var i= 0; i < rows.length; i++){
            row = rows[i];
            torrentNameElement = row.querySelector("td:nth-child(2) table.torrentname td:nth-child(1) a:first-of-type");
            filmDetailPage = torrentNameElement ? torrentNameElement.getAttribute('href') : "";
            filmName = torrentNameElement ? torrentNameElement.getAttribute('title') : "";
            filmName = filmName.replace( /\s/g, "-" );
            rowNameElement = row.querySelector("td:nth-child(2) table.torrentname td:nth-child(1)");
            imdMatches = /.+?<img.+?>\s+(.+?)\s+\(.+votes.+/.exec(rowNameElement.innerHTML);
            totalVoteMatches = /.+\((.+?)votes\).+/.exec(rowNameElement.innerText);
            genreMatches = /.+?Genres:(.+)/.exec(rowNameElement.innerText);
            torrentDownloadLinkElement = row.querySelector("td:nth-child(2) table.torrentname td:nth-child(2) a:nth-child(1)");
            torrentDownloadLinkUrl = torrentDownloadLinkElement.getAttribute('href');
            totalCommentElement = row.querySelector("td:nth-child(3) a:nth-child(1)");
            totalComment = totalCommentElement.innerText;
            timeAliveElement = row.querySelector("td:nth-child(4)");
            timeAlive = timeAliveElement.innerText;
            timeAlive = timeAlive.replace(/\n/g, ", ");
            filmSizeElement = row.querySelector("td:nth-child(5)");
            filmSize = filmSizeElement.innerText;
            filmSize = filmSize.replace( /\n/g, " ");
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

            torrentRows.push(
                {
                    "filmDetailPage" : filmDetailPage,
                    "filmName" : filmName,
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
            );
        };

        return torrentRows;
    });

    casper.DownloadTorrent(pageData, torrentTypeName);

    pageData = casper.getTorrentFilePathForPageData(pageData, torrentTypeName);
    pageData =  casper.getFilmDetailForPageData(pageData);
    state[torrentTypeName] = state[torrentTypeName].concat(pageData);

    var notHasMoreData = casper.evaluate(function() {
       var notHasMoreData = document.querySelector("font.gray b[title='Alt+Pagedown']");
       return notHasMoreData;
    });

    if (!notHasMoreData) {
       page = page + 1;
       casper.thenOpen(url + "/torrents_ajax.php?inclbookmarked=0&sltCategory=" + torrentTypeID + "&incldead=1&spstate=0&page=" + page, scrape);
    }
};

//set input data
casper.thenOpen(url, function(){
    this.sendKeys("input[name='username']", loginUserName);
    this.sendKeys("input[name='password']", loginPassword);

    this.click("input[type='submit']");
    this.waitWhileVisible('a[href="/torrents.php"]', function(){
    });
});

casper.thenOpen(url + "torrents.php");
casper.each(typeOfTorrents, function(casper, torrentType){
    casper.thenOpen(url + "/torrents_ajax.php?inclbookmarked=0&sltCategory=" + torrentType["torrentCategoryID"] + "&incldead=1&spstate=0&page=0", scrape).then(function(){
        var torrentTypeName = torrentType["torrentType"];
        casper.saveJSON(torrentTypeName + ".json", state[torrentTypeName]);
    });
});

casper.run();