const puppeteer = require('puppeteer');
const options = process.argv;
// let pageUrl = 'http://10.120.184.99:8107/sa/report/?project=default&id=55'
// let cookie = 'Ab2Un3rH9Ir0xFYNOXY2f1xABXhcAbGwrFMmLDpDCdbTSfTISeiLJiEdFeaEhI3k6NMhQJdwvuhjWWGWEl4UPhrhOt1yMVbxuLoTy6mNsux15YsQPQkfX2eNvGeqT4fd'

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
        const dom = document.querySelector('.index_canvas_2n93K')
        // 截图区域(需要一个固定的 id 或 class)滚动高度
        const scrollHeight = dom.scrollHeight
        // 滚动条向下滚动 distance
        dom.scrollBy(0, distance)
        totalHeight += distance
        // 当滚动的总高度 大于截图区域高度，说明滚动到底了
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}

const run = async () => {
  let pageUrl
  let cookie
  let fileName

  if (options.length >= 6) {
    pageUrl = options[2];
    cookie = options[3];
    fileName = options[4];
    fileType = options[5];
  }

  const browser = await puppeteer.launch({
    headless: true,
    devtools: false
  });

  const page = await browser.newPage();
  // await page.setRequestInterception(true);

  // 请求拦截  参考：https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagesetrequestinterceptionenabledvalue
  // 一旦启用了请求拦截，每个请求都将停止，除非它继续、响应或中止
  // page.on('request', (interceptedRequest) => {
  //   if (
  //     interceptedRequest.url().endsWith('query')
  //   ){
  //    // interceptedRequest.abort();
  //    console.log(  interceptedRequest.url())

  //   }
  //   interceptedRequest.continue();
  //   // else interceptedRequest.continue();
  // });

  // 设置 cookie，后续应该由接口传入
  await page.setCookie({
    url: pageUrl,
    name: 'sensorsdata-token',
    value: cookie
  })

  await page.goto(pageUrl)
  // 设置tab页的尺寸，puppeteer允许对每个tab页单独设置尺寸
  await page.setViewport({
    width: 1920,
    height: 1080
  });

  // 等待layout元素加载之后
  await page.waitForSelector('.react-grid-layout', {
    timeout: 120 * 1000
  })

  // 自动滚动触发懒加载
  await autoScroll(page);

  // 判断所有组件的轮廓加载完成，完成后就可以获取要截图的页面的高度，从而设置截图的高度
  const pageRendered = page.evaluate(() => {
    const observeDom = document.getElementsByClassName('react-grid-layout')[0]
    const observer = new MutationObserver(() => {
      const componentList = observeDom
      if (componentList && componentList.children && componentList.children.length) {
        observer.disconnect();
        console.log('canvas resolve')
        return Promise.resolve()
      }
    });
    observer.observe(observeDom, {
      attributes: false,
      childList: true,
      subtree: true
    });
  })

  const timePromise = sleep(30 * 1000);

  await Promise.race([pageRendered, timePromise]);

  // 页面加载完成之后获取某个dom的宽度和高度
  const dimensions = await page.evaluate(() => {
    const dom = document.querySelector('.index_canvas_2n93K')
    return {
      width: dom.scrollWidth,
      height: dom.scrollHeight + 300,
      deviceScaleFactor: window.devicePixelRatio
    };
  });
  // 设置页面分辨率
  await page.setViewport(dimensions);
  // 只截图图表区域
  const body = await page.$('.index_canvas_2n93K')

  await sleep(5000)

  if (fileType === 'image') {
    await body.screenshot({ path: fileName + '.png' });
  } else {
    await page.pdf({ path: 'html-page.pdf', width: dimensions.width, height: dimensions.height });
  }

  await browser.close();
  //process.stdout.write(imgStream);
  console.log('end')
}

run()


