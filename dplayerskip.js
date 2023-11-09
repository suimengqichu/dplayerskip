// ==UserScript==
// @name            观影跳过片头片尾、播放速度、全屏、自动播放下一集
// @namespace       http://tampermonkey.net/
// @version         beta4
// @description     通过按键控制跳过片头片尾、播放速度、全屏、自动播放下一集
// @author          随梦期初
// @match           *://lnyzyw.com/*
// @match           *://www.ysgc1.cc/*
// @match           *://www.bytpl.com/*
// @icon            https://www.google.com/s2/favicons?sz=64&domain=lnyzyw.com
// @grant           none
// @license         GPLv3
// ==/UserScript==


const speedArray = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.0]
const intervalTime = 2000

const doc_s = window.document
const dplayerDanloading = "div.dplayer-video-wrap > div.dplayer-bezel > span.dplayer-danloading"
const dplayerBezel = "div.dplayer-video-wrap > div.dplayer-bezel"
const videoEle = "div.dplayer-video-wrap > .dplayer-video-current"
const adEle = "#adv_wrap_hh"

let dplayer_bezel_event,
    dplayer_danloading,
    dplayer_bezel,
    video_ele

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
            myPlayer.message_box.show(`${prop}: ${value}`)
            video_ele[`data_${prop}`] = value
        } else {
            localStorage.setItem("speed", speedArray[value].toString())

            myPlayer.message_box.show(`speed: ${speedArray[value]}`)

            target.speed = speedArray[value]
            video_ele.playbackRate = speedArray[value]
        }

        if (prop === "skip_end") {
            myPlayer.skip_end_event()
        }
    }
}

const myPlayerConfig = new Proxy(config, handler)

const myPlayer = {
    message_box: {
        show: function (message) {
            if (!dplayer_danloading) {
                let message_ui = doc_s.createElement("span");
                message_ui.className = "dplayer-danloading";
                dplayer_bezel.appendChild(message_ui);

                dplayer_danloading = window[window.length - 1] && window[window.length - 1].document && window[window.length - 1].document.querySelector(dplayerDanloading) ? window[window.length - 1].document.querySelector(dplayerDanloading) : window.document.querySelector(dplayerDanloading)
            }

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
        clearInterval(interval)

        dplayer_danloading = window[window.length - 1] && window[window.length - 1].document && window[window.length - 1].document.querySelector(dplayerDanloading) ? window[window.length - 1].document.querySelector(dplayerDanloading) : window.document.querySelector(dplayerDanloading)
        dplayer_bezel = window[window.length - 1] && window[window.length - 1].document && window[window.length - 1].document.querySelector(dplayerBezel) ? window[window.length - 1].document.querySelector(dplayerBezel) : window.document.querySelector(dplayerBezel)

        if (window.document.querySelector(videoEle)) {

            video_ele.playbackRate = myPlayerConfig.speed
            video_ele.data_skip_start = myPlayerConfig.skip_start
            video_ele.data_skip_end = myPlayerConfig.skip_end

            if (parseInt(myPlayerConfig.skip_start) > parseInt(video_ele.currentTime)) {
                video_ele.currentTime = myPlayerConfig.skip_start
            }

            video_ele.autoplay = true
            video_ele.oncanplay = this.can_play
            video_ele.onplay = this.play_event
            video_ele.onpause = this.pause_event
            video_ele.data_skip_end && this.skip_end_event()
        }
        doc_s.onkeydown = this.key_down

    },
    skip_end_event: function () {
        let interval = setInterval(function () {
            let left_duration = myPlayer.left_duration()

            if (left_duration < video_ele.data_skip_end) {
                video_ele.currentTime = video_ele.duration;
                clearInterval(interval)
            } else if (video_ele.data_skip_end === 0) {
                clearInterval(interval)
            }
        }, intervalTime)
    },
    left_duration: function () {
        return video_ele.duration - video_ele.currentTime
    },
    remove_localStorage: function () {
        Object.keys(config).map(v => localStorage.removeItem(v))
        video_ele.playbackRate = 1.0
        video_ele.data_skip_start = 0
        video_ele.data_skip_end = 0
    },
    key_down: function (e) {
        if (doc_s.activeElement && doc_s.activeElement.id !== "" || (doc_s.activeElement.tagName.toLowerCase() in ['input', 'textarea'])) {
            return
        } else {
            e.preventDefault()
            let speed = video_ele.playbackRate
            let speed_index = speedArray.indexOf(speed)

            switch (e.keyCode) {
                case 13:
                    video_ele.requestFullscreen().then(() => {})
                    break;
                case 27:
                    video_ele.exitFullscreen().then(() => {})
                    break;
                case 32:
                    if (e.currentTarget.querySelector(videoEle)) {
                        return
                    }

                    if (video_ele.paused) {
                        video_ele.play()
                    } else {
                        video_ele.pause()
                    }
                    break;
                case 67:
                    if (speedArray.length - speed_index > 0) {
                        myPlayerConfig.speed_index = speed_index + 1
                    }
                    break;
                case 78:
                    break;
                case 80:
                    break;
                case 82:
                    myPlayer.remove_localStorage()
                    myPlayer.message_box.show('reset speed and skip')
                    break;
                case 83:
                    break;
                case 84:
                    myPlayerConfig.skip_start = video_ele.currentTime
                    break;
                case 87:
                    myPlayerConfig.skip_end = myPlayer.left_duration()
                    break;
                case 88:
                    if (speed_index > 0) {
                        myPlayerConfig.speed_index = speed_index - 1
                    }
                    break;
            }
        }
        doc_s.onkeydown = () => {
        }
        setTimeout(function () {
            doc_s.onkeydown = myPlayer.key_down
        }, 200)
    },
    can_play: function () {



    },
    pause_event: function() {
        if (document.querySelector(adEle)) {
            document.querySelector(adEle).remove()
        }

        video_ele.paused = true
    },
    play_event: function() {
        video_ele.paused = false
    }
}

// doc_s.onkeydown = myPlayer.key_down

const interval = setInterval(function () {
    video_ele = window[window.length - 1] && window[window.length - 1].document && window[window.length - 1].document.querySelector(videoEle) ? window[window.length - 1].document.querySelector(videoEle) : window.document.querySelector(videoEle)

    if (video_ele) {
        myPlayer.init()
    }

}, 1000)

