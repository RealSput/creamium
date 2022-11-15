const puppeteer = require('puppeteer');
const express = require('express');
const ews = require('express-ws');
const app = express();
ews(app);

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
	const clients = [];
    await page.goto('https://google.com');
	var nav = false;
    app.use(express.static('./public'))

    app.ws('/c', function(ws, req) {
        let ind = clients.length + 1;
        clients.push(ws);
        setInterval(async () => {
			if (!nav) {
				const image = await page.screenshot({
					type: 'png'
				});
				clients.forEach((x) => x.send(JSON.stringify({type: 'render', value: 'data:image/png;base64,'+image.toString('base64')})))
			}
	   });
        ws.on('message', async function(msg) {
            msg = JSON.parse(msg.toString());
			switch(msg.type) {
				case "keydown":
					page.keyboard.press(msg.value);
				break;
				case "ctrl-combo":
					page.keyboard.down('ControlLeft')
					page.keyboard.press(msg.value);
					page.keyboard.up('ControlLeft')
				break;
				case "mousemove":
					page.mouse.move(msg.value[0], msg.value[1]);
				break;
				case "mousedown":
					page.mouse.down();
				break;
				case "mouseup":
					page.mouse.up();
				break;
				case "nclick":
					page.mouse.click(msg.value.pos.x, msg.value.pos.y, { clickCount: msg.value.times })
				break;
				case "back":
					setTimeout(async () => {
						await page.goBack();
						nav = false;
					}, 500);
				break;
				case "forward":
					setTimeout(async () => {
						await page.goForward();
						nav = false;
					}, 500);
				break;
				case "navigate":
					nav = true;
					await page.waitForTimeout(500);
					await page.goto(msg.value);
					nav = false;
				break;
			}
        });
        ws.on('close', () => delete ws[ind]);
    });

    app.listen(8080, () => {
		console.log('Listening at port 8080')
	});
})();