// ==UserScript==
// @name         BeatSaver Previews
// @namespace    https://github.com/coolvrdude/BeatSaver-Previews/
// @version      0.1.1
// @description  Restores the Audio Preview option for Beat Saver maps.
// @author       coolvrdude
// @match        https://beatsaver.com/*
// @icon         https://www.google.com/s2/favicons?domain=beatsaver.com
// @grant        none
// @grant        unsafeWindow
// @updateURL   https://raw.githubusercontent.com/coolvrdude/BeatSaver-Previews/master/beatsaver-previews.user.js
// @downloadURL https://raw.githubusercontent.com/coolvrdude/BeatSaver-Previews/master/beatsaver-previews.user.js
// @require https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js
// @require https://gist.githubusercontent.com/mjblay/18d34d861e981b7785e407c3b443b99b/raw/debc0e6d4d537ac228d1d71f44b1162979a5278c/waitForKeyElements.js
// @run-at document-end
// ==/UserScript==

(function() {
    window._previewStatus = "not-playing";
    //window._ATTACH_ELEMENT = document.getElementsByClassName("ml-auto")[0];
    function downloadAndStartPreview(){
        if (window._previewStatus == "playing") {
            URL.revokeObjectURL(window._previewURL);
            window._previewStatus = "not-playing";
            try {
                document.getElementById("musicplayer").remove();
                return;
            } catch (error) {
                console.log("Something happened when trying to remove the music player");
                window._previewStatus = "not-playing";
                downloadAndStartPreview();
                return;
            }

        }
        if (window._previewStatus == "downloading"){ // oops
            return;
        }
        window._previewStatus = "downloading";

        var loadingIcon = document.createElement("i");
        loadingIcon.className = "fa fa-spinner fa-spin";
        loadingIcon.id = "loadingIcon";
        document.getElementsByClassName("ml-auto")[0].appendChild(loadingIcon);
        var DL_API_BASE = "https://beatsaver.com/api/download/key/";
        var musicplayer = document.createElement("div");
        musicplayer.id = "musicplayer";
        // Check that JSZip is loaded.
        if (!window.JSZip) {
            var script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js";
            document.getElementsByTagName('head')[0].appendChild(script);
        }

        var mapID = location.toString().split("https://beatsaver.com/maps/")[1];
        /* Download the map via the API. */
        fetch(DL_API_BASE + mapID).then(function(response) {
            /* Parse the zip file */
            const blob = response.blob();
            var zip = new JSZip();
            return zip.loadAsync(blob);
        }).then(function(zip) {
            //console.log(zip);
            const info = zip.file("Info.dat"); // WHY IS IT CAPITALIZED?
            info.async("text").then(function(temp) {
                //console.log(temp);
                const infoJSON = JSON.parse(temp);
                const songFilename = infoJSON._songFilename;
                const audioFile = zip.file(songFilename);
                const audioBlob = audioFile.async("blob");
                audioBlob.then(function(audioBlob) {
                    musicplayer.innerHTML = "";
                    window._previewStatus = "playing";
                    var audioURL = URL.createObjectURL(audioBlob);
                    window._previewURL = audioURL;
                    var audio = document.createElement("audio");
                    audio.style.paddingTop = "10px";
                    audio.controls = true;
                    audio.src = audioURL;
                    audio.autoplay = true;
                    musicplayer.appendChild(audio);
                    document.getElementById("loadingIcon").remove();
                    document.getElementsByClassName("ml-auto")[0].appendChild(musicplayer); // Apparently, storing the element in a variable doesn't work?? Why??
                });

            });
        }).catch(function(error) {
            console.log(error);
            musicplayer.innerHTML = "Error: Could not download map. Please try again later.";
            document.getElementsByClassName("ml-auto")[0].appendChild(musicplayer);
            document.getElementById("loadingIcon").remove();
            return;
        });
    }
    function hookCardHeader(){
        //console.log(document.getElementsByClassName("ml-auto")[0]);
        if (window.location.toString().includes("maps")){
            //console.log("test");
            var icon = document.createElement("i");
            icon.className = "fa fa-music";
            var link = document.createElement("a");
            link.href = "javascript:void(0);";
            link.title = "Audio Preview";
            link.setAttribute("aria-label", "Start Audio Preview");
            link.onclick = downloadAndStartPreview;
            link.appendChild(icon);
            document.getElementsByClassName("ml-auto")[0].appendChild(link);
        }
    }
    waitForKeyElements(".card", hookCardHeader);
    window.addEventListener('popstate', function(){
        if (window._previewStatus == "playing") {
            URL.revokeObjectURL(window._previewURL);
            window._previewStatus = "not-playing";
            document.getElementById("musicplayer").remove();
        }
        waitForKeyElements(".card", hookCardHeader);
    });
})();
