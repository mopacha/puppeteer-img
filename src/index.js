const puppeteer = require('puppeteer');
 
const loginCookie = 'Yb11EAkEUV9bfEdV5503eRrYiL8qCQLm2k03tHrr8Fg2mqr2OUJzE6X6se6cHSbdbdb5jGHInT0qJUPVzWCt1hjwkA7h0I2HCgF5UA1XZFxrnAXCnPZgH4Wf1BotoY1l'
 
async function autoScroll(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      // 滚动总高度
      let totalHeight = 0;
      // 每次向下滚动 100px
      const distance = 100
      const timer = setInterval(() => {
        const dom = document.querySelector('.index_canvas_1TQUT')
        // 截图区域(需要一个固定的 id 或 class)滚动高度
        const scrollHeight = dom.scrollHeight
        // 滚动条滚动 distance
        dom.scrollBy(0, distance)
        totalHeight += distance
        if(totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}
 
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // 设置 cookie，后续应该由接口传入
  await page.setCookie({
    url: "http://10.120.184.99:8107",
    name: 'sensorsdata-token',
    value: loginCookie
  })
  // 设置tab页的尺寸，puppeteer允许对每个tab页单独设置尺寸
  await page.setViewport({
    width: 1920,
    height: 6080
  });
  await page.goto('http://10.120.184.99:8107/sa/report/?project=default&id=35');
  // 等待首屏加载完成
  await page.waitForTimeout(3000)
  // 自动滚动触发懒加载
  await autoScroll(page)
  // 只截图图表区域
  const body = await page.$('.index_canvas_1TQUT')
  await body.screenshot({path: 'example.png', });
 
  await browser.close();
})();