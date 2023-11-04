// ==UserScript==
// @name            星空影院跳过片头片尾、播放速度、全屏、自动播放下一集
// @namespace       http://tampermonkey.net/
// @version         beta2
// @description     星空影院定制化，通过按键控制跳过片头片尾、播放速度、全屏、自动播放下一集
// @author          随梦期初
// @match           *://lnyzyw.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=lnyzyw.com
// @grant           none
// @license         GPLv3
// ==/UserScript==


const doc_s = window.document
const dplayerDanloading = "div.dplayer-video-wrap > div.dplayer-bezel > span.dplayer-danloading"
const dplayerBezel = "div.dplayer-video-wrap > div.dplayer-bezel"
const videoEle = "div.dplayer-video-wrap > .dplayer-video-current"

let dplayer_bezel_event = 0,
    dplayer_danloading = window.length > 2 ? window[2].document.querySelector(dplayerDanloading) : "",
    dplayer_bezel = window.length > 2 ? window[2].document.querySelector(dplayerBezel) : "",
    video_ele = window.length > 2 ? window[2].document.querySelector(videoEle) : ""

const speedArray = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0]

const config = {
    skip_start: localStorage.getItem("skip_start") ? parseInt(localStorage.getItem("skip_start")) : 0,
    skip_end: localStorage.getItem("skip_end") ? parseInt(localStorage.getItem("skip_end")) : 0,
    speed: localStorage.getItem("speed") ? parseInt(localStorage.getItem("speed")) : 1.0,
    speed_index: localStorage.getItem("speed_index") ? parseInt(localStorage.getItem("speed_index")) : 9
}

const handler = {
    get(target, prop) {
        return target[prop]
    },
    set(target, prop, value) {
        target[prop] = value

        localStorage.setItem(prop, value)

        if (prop !== "speed_index") {
            myplayer.message_box.show(`${prop}: ${value}`)
        } else {
            localStorage.setItem("speed", speedArray[value].toString())

            myplayer.message_box.show(`speed: ${speedArray[value]}`)

            target.speed = speedArray[value]
            video_ele.playbackRate = speedArray[value]
        }
    }
}

const myplayerConfig = new Proxy(config, handler)

const myplayer = {
    message_box: {
        show: function (message) {
            if (!dplayer_danloading) {
                let message_ui = doc_s.createElement("span");
                message_ui.className = "dplayer-danloading";
                dplayer_bezel.appendChild(message_ui);
            }

            dplayer_danloading = dplayer_danloading ? dplayer_danloading : window[2].document.querySelector(dplayerDanloading)

            dplayer_danloading.style.fontSize = "x-large";
            dplayer_danloading.innerHTML = message;
            dplayer_danloading.style.display = "";

            dplayer_bezel_event = setTimeout(this.hide, 2000);
        },
        hide: function () {
            clearTimeout(dplayer_bezel_event)
            dplayer_danloading.style.display = "none";
        }
    },
    init: function () {

        dplayer_danloading = dplayer_danloading ? dplayer_danloading : window[2].document.querySelector(dplayerDanloading)
        dplayer_bezel = dplayer_bezel ? dplayer_bezel : window[2].document.querySelector(dplayerBezel)
        this.can_play()

        doc_s.onkeydown = this.key_down
    },
    remove_localStorage: function () {
        Object.keys(config).map(v => localStorage.removeItem(v))
    },
    key_down: function (e) {
        if (doc_s.activeElement && doc_s.activeElement.id !== "" || (doc_s.activeElement.tagName.toLowerCase() in ['input', 'textarea'])) {
            return
        } else {
            e.preventDefault()
            switch (e.keyCode) {
                case 13:
                    video_ele.requestFullscreen().then(() => {})
                    break;
                case 27:
                    video_ele.exitFullscreen().then(() => {})
                    break;
                case 32:
                    if (video_ele.paused) {
                        video_ele.play()
                    } else {
                        video_ele.pause()
                    }
                    break;
                case 67:
                    if (speedArray.length - myplayerConfig.speed_index - 1 > 0) {
                        myplayerConfig.speed_index += 1
                    }
                    break;
                case 78:
                    break;
                case 80:
                    break;
                case 82:
                    myplayer.remove_localStorage()
                    break;
                case 83:
                    break;
                case 84:
                    myplayerConfig.skip_start = video_ele.currentTime
                    break;
                case 87:
                    myplayerConfig.skip_end = video_ele.duration - video_ele.currentTime
                    break;
                case 88:
                    if (myplayerConfig.speed_index - 1 > 0) {
                        myplayerConfig.speed_index -= 1
                    }
                    break;
            }
        }
        doc_s.onkeydown = () => {
        }
        setTimeout(function () {
            doc_s.onkeydown = myplayer.key_down
        }, 200)
    },
    can_play: function () {
        video_ele.playbackRate = myplayerConfig.speed
        video_ele.autoplay = true

        if (parseInt(myplayerConfig.skip_start) > parseInt(video_ele.currentTime)) {
            video_ele.currentTime = myplayerConfig.skip_start
        }

    }
}

doc_s.onkeydown = myplayer.key_down

const interval = setInterval(function () {

    if (video_ele) {
        myplayer.init()
        clearInterval(interval)
    }
    video_ele = window.length > 2 ? window[2].document.querySelector(videoEle) : ""
}, 1000)

