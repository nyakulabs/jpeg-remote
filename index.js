(async () => {
    // jpeg-remote; a jpeg & puppeteer-based remote browser
    console.log('starting');

    const startingURL = 'https://google.com/';

    // create websocket
    const Socket = require('ws')
        , socket = new Socket.Server({
            'port': 3822
        });

    // create browser
    const puppeteer = require('puppeteer')
        , browser = await puppeteer.launch({headless: true})
        , page = await browser.newPage();

    const url = require('url-parse');

    page.setViewport({
        'width': 1280,
        'height': 720
    });

    await page.goto(startingURL);

    // for debugging purposes
    /*
    page.on('console', c => {
        console.log(c.text());
    })
    */

    function cast(dat) {
        socket.clients.forEach(ws => {
            ws.send(dat);
        })
    }

    socket.on('connection', ws => {
        ws.on('message', async (data) => {
            dat = JSON.parse(data);
            if (dat.type == 'move') {
                // console.log(dat);
                await page.mouse.move(dat.posX, dat.posY);
            } else if (dat.type == 'click') {
                // console.log(dat);
                await page.mouse.click(dat.posX, dat.posY);
            } else if (dat.type == 'key') {
                await page.keyboard.press(dat.key)
            } else if (dat.type == 'scroll') {
                page.evaluate(`els = document.querySelectorAll(":hover")\nels.forEach(el => {\nel.scrollTop = el.scrollTop + ${dat.ys*10};\n})`)
            } else if (dat.type == 'url') {
                page.evaluate(`window.href = ${dat.url}`);
            }
        })
    })

    

    // 5fps output
    setInterval(() => {
        page.screenshot({
            'type': 'jpeg',
            'encoding': 'base64',
            'quality': 45
        }).then(jpg => {
            cast(jpg);
        })
    }, 1)
})();