const puppeteer = require('puppeteer');
const loginCookie = 'Yb11EAkEUV9bfEdV5503eRrYiL8qCQLm2k03tHrr8Fg2mqr2OUJzE6X6se6cHSbdbdb5jGHInT0qJUPVzWCt1hjwkA7h0I2HCgF5UA1XZFxrnAXCnPZgH4Wf1BotoY1l'

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

// 右边区域页面滚动到底，再截图
async function autoScroll(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      // 滚动总高度
      let totalHeight = 0;
      // 每次向下滚动 200px
      const distance = 200
      const timer = setInterval(() => {
        const dom = document.querySelector('.index_canvas_1TQUT')
        // 截图区域(需要一个固定的 id 或 class)滚动高度
        const scrollHeight = dom.scrollHeight
        // 滚动条滚动 distance
        dom.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}

const run = async () => {
  const browser = await puppeteer.launch({ headless: true, devtools: false });
  const page = await browser.newPage();
  // 设置 cookie，后续应该由接口传入
  await page.setCookie({
    url: "http://10.120.184.99:8107",
    name: 'sensorsdata-token',
    value: loginCookie
  })
  await page.goto('http://10.120.184.99:8107/sa/report/?project=default&id=55');
  // 设置tab页的尺寸，puppeteer允许对每个tab页单独设置尺寸
  await page.setViewport({
    width: 1920,
    height: 1080
  });

  await page.waitForNavigation({
    waitUntil: "load",
    timeout: 30000
  })

  await page.waitForSelector('.react-grid-layout')
  // 自动滚动触发懒加载
  await autoScroll(page);

  const pageRendered = page.evaluate(() => {
    return new Promise(resolve => {
      const observeDom = document.getElementsByClassName('react-grid-layout')[0]
      const observer = new MutationObserver(() => {
        const componentList = observeDom
        if (componentList && componentList.children && componentList.children.length) {
          observer.disconnect();
          console.log('canvas resolve')
          resolve()
        }
      });
      observer.observe(observeDom, {
        attributes: false,
        childList: true,
        subtree: true
      });
    })
  })

  const timePromise = sleep(10000);
  await Promise.race([pageRendered, timePromise]);

  const dimensions = await page.evaluate(() => {
    const dom = document.querySelector('.index_canvas_1TQUT')
    return {
      width: dom.scrollWidth,
      height: dom.scrollHeight + 300,
      deviceScaleFactor: window.devicePixelRatio
    };
  });
  await page.setViewport(dimensions);
  // 只截图图表区域
  const body = await page.$('.index_canvas_1TQUT')
  await body.screenshot({ path: 'example.png' });
  await browser.close();
}

run()


