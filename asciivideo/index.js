const _ = absol.coreDom._;
const $ = absol.coreDom.$;
const $dBody = $(document.body);
const openFileDialog = absol.require("absol-acomp/js/utils").openFileDialog;
const hitElement = absol.require('absol/src/HTML5/EventEmitter').hitElement;

const screenBound = $dBody.getBoundingClientRect();
const $console = _('.av-console').addTo($dBody);

const charList = Array(255).fill('').map(function (u, i) {
    var c = String.fromCharCode(i).trim();
    if (c.length > 0) return c;
    return '';
}).concat([' ']);


var consoleWidth, consoleHeight;
var consoleBound;
var charRatio;
var charWidth = 3, charHeight = 5;
var grayTable;

function rgb2gray(r, g, b, a) {
    if (a === 0) return 255;
    return Math.round(((0.3 * r) + (0.59 * g) + (0.11 * b)));
}

function grayOfPixels(data) {
    var res = 0;
    for (var i = 0; i < data.length; i += 4) {
        res += rgb2gray(data[i], data[i + 1], data[i + 2], data[3])
    }
    return res * 4 / data.length;
}

function testScreenConsole() {
    $console.clearChild();
    var $row = _({
        child: { text: 'A' }
    });
    $console.addChild($row);
    for (consoleWidth = 1; consoleWidth < 1000; ++consoleWidth) {
        $row.firstChild.data = " ".repeat(consoleWidth);
        consoleBound = $console.getBoundingClientRect()
        if (consoleBound.width > screenBound.width) {
            break;
        }
    }
    for (consoleHeight = 2; consoleHeight < 1000; ++consoleHeight) {
        $console.addChild($row.cloneNode(true));
        consoleBound = $console.getBoundingClientRect()
        if (consoleBound.height > screenBound.height) {
            break;
        }
    }
    charWidth = consoleBound.width / consoleWidth;
    charHeight = consoleBound.height / consoleHeight
    charRatio = charWidth / charHeight;
}

function makeGrayTable() {
    var cW = Math.round(charWidth);
    var cH = Math.round(charHeight);
    var $cv = _({
        tag: 'canvas',
        style: {
            position: 'fixed',
            top: '10px',
            left: '10px'
        },
        attr: {
            width: cW + 'px',
            height: cH + 'px'
        }
    }).addTo($dBody);
    var ctx = $cv.getContext('2d');
    ctx.font = '10px Consolas';

    var c, gray;
    var minGray = Infinity, maxGray = -Infinity;
    var gray2Char = {};
    var grayKey;
    for (var i = 0; i < charList.length; ++i) {
        c = charList[i];
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, cW, cH);
        ctx.fillStyle = 'black';
        ctx.fillText(c, 0, cH);
        gray = grayOfPixels(ctx.getImageData(0, 0, cW, cH).data);
        minGray = Math.min(minGray, gray);
        maxGray = Math.max(maxGray, gray);
        grayKey = gray.toFixed(3);
        if (!gray2Char[grayKey] || !grayKey.match(/[a-zA-Z0-9\s_]/)) {
            gray2Char[grayKey] = c;
        }
    }
    var char2gray = Object.keys(gray2Char).reduce(function (ac, cr) {
        var gray = parseFloat(cr);
        var char = gray2Char[cr];
        ac[char] = gray;
        return ac;
    }, {});

    function findNearest(x) {
        var minD = Infinity;
        var d;
        var res;
        for (var c in char2gray) {
            d = Math.abs(char2gray[c] - x);
            if (d < minD) {
                res = c;
                minD = d;
            }
        }
        return res;
    }


    grayTable = Array(256).fill(null).map(function (u, i) {
        return findNearest(minGray + i / 255 * (maxGray - minGray));
    });
    $cv.remove();
}

function drawConsole(pixels) {
    var s, c;
    var offset = 0;
    for (var i = 0; i < consoleHeight; ++i) {
        s = '';
        if (pixels[offset + 3] === 0) break;
        for (var j = 0; j < consoleWidth; ++j) {
            c = grayTable[rgb2gray(pixels[offset], pixels[offset + 1], pixels[offset + 2], pixels[offset + 3])] || ' ';
            s += c;
            offset += 4;
        }
        $console.childNodes[i].firstChild.data = s;
    }
}

function uploadVideo() {
    var $modal = _({
        tag: 'modal',
        class: 'av-upload-modal',
        child: [
            {
                tag: 'dropzone',
                class: 'av-upload-area',
                child: [
                    { tag: 'h3', child: { text: 'Upload your video' } },
                    {
                        class: 'av-row',
                        child: {
                            tag: 'img',
                            class: 'av-file-ico',
                            props: {
                                src: 'mov.svg'
                            }
                        }
                    },
                    {
                        class: 'av-row',
                        child: [
                            '<label>URL: </label>',
                            {
                                tag: 'input',
                                class: 'av-file-url',
                                props: {
                                    value: 'http://absol.cf/share/No%20Friends%20AMV.mp4'
                                }
                            }]
                    },
                    {
                        tag: 'flexiconbutton',
                        class: ['av-play-btn', 'primary'],
                        props: {
                            icon: 'span.mdi.mdi-play',
                            text: 'PLAY',
                        }
                    }
                ]
            }
        ]

    }).addTo($dBody);
    var $playBtn = $('.av-play-btn', $modal);
    var $fileIco = $('.av-file-ico', $modal);
    var $url = $('.av-file-url', $modal);
    var file;
    var $dropzone = $('dropzone', $modal)
        .on('filedrop', function (event) {
            event.preventDefault();
            file = event.files[0];
            if (file && file.type.match(/^video/)) {
                $url.value = URL.createObjectURL(file);
                $fileIco.addStyle('opacity', 1);
            }
        })
        .on('click', function (event) {
            if (!hitElement($playBtn, event))
                openFileDialog({ accept: 'video/*' }).then(function (files) {
                    if (files && files.length > 0) {
                        file = files[0];
                        $url.value = URL.createObjectURL(file);
                        $playBtn.addClass('primary');
                        $fileIco.addStyle('opacity', 1);
                    }
                });
        });

    return new Promise(function (rs) {
        $playBtn.on('click', function () {
            $modal.remove();
            if ($url.value) rs($url.value);
        })
    })
}

function playVideo(videoURL) {
    var $fps = _({
        class: 'av-fps',
        child: { text: '0FPS' }
    }).addTo($dBody);
    /***
     * @type {HTMLVideoElement | AElement}
     */
    var $video = _({
        tag: 'video',
        class: 'av-video',
        props: {
            src: videoURL,
            crossOrigin: 'Anonymous',
            playsInline: true
        }
    }).addTo($dBody);

    var vWidth, vHeight;

    var nCol;
    var nRow
    /***
     * @type {HTMLCanvasElement | AElement}
     */
    var $canvas = _({
        tag: 'canvas',
        class: 'av-canvas',
        attr: {
            width: consoleWidth + 'px',
            height: consoleHeight + 'px'
        }
    }).addTo($dBody);
    var ctx = $canvas.getContext('2d');

    var drawInv = -1;
    var last = new Date().getTime();

    function draw() {
        var now = new Date().getTime();
        var fps = 1000 / (now - last);
        last = now;
        $fps.firstChild.data = Math.round(fps) + 'FPS';
        ctx.drawImage($video, 0, 0, nCol, nRow);
        var imgData = ctx.getImageData(0, 0, consoleWidth, consoleHeight);
        drawConsole(imgData.data)
    }

    $video.on('play', function () {
        var bound = this.getBoundingClientRect();
        vWidth = bound.width;
        vHeight = bound.height;
        var vRatio = vWidth / vHeight;


        var sRatio = screenBound.width / screenBound.height;
        if (sRatio < vRatio) {
            nCol = Math.round(screenBound.width / charWidth);
            nRow = Math.round(nCol / vRatio * (charWidth / charHeight));
            console.log(nCol, nRow)

        }
        else {
            nRow = Math.round(screenBound.height / charHeight);
            nCol = Math.round(nRow * vRatio / (charRatio));
        }

        $canvas.attr('width', nCol + 'px')
            .attr('nRow', nRow + 'px');
        if (drawInv < 0) drawInv = setInterval(draw, 1000 / 15);
    }).on('pause', function () {
        if (drawInv > 0) {
            clearInterval(drawInv);
            drawInv = -1;
        }
    }).on('stop', function () {
        if (drawInv > 0) {
            clearInterval(drawInv);
            drawInv = -1;
        }
    });


    $video.play();
}

testScreenConsole();
makeGrayTable();
uploadVideo()
    .then(playVideo);
