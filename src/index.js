const puppeteer = require('puppeteer');
const options = process.argv;
const sleep = time => new Promise(resolve => setTimeout(resolve, time))

// 右边区域页面滚动到底，再截图
async function autoScroll(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      // 滚动总高度
      let totalHeight = 0;
      // 每次向下滚动 200px
      const distance = 200;
      const dom = document.querySelector('.index_canvas_2n93K')
      if (!dom) {
        reject('no dom querySelector')
      }
      const timer = setInterval(() => {
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

const screenshot = async () => {
  let pageUrl
  let cookie
  let filePath
  if (options.length >= 5) {
    pageUrl = options[2];
    cookie = options[3];
    filePath = options[4];
  }

  let fileType = filePath.indexOf('.png') > -1 ? 'image' : 'pdf'
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
    timeout: 60 * 1000
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
      height: dom.scrollHeight + 100, // 加100 高度，保证截全
      deviceScaleFactor: window.devicePixelRatio
    };
  });
  // 设置页面分辨率
  await page.setViewport(dimensions);
  // 只截图图表区域
  const body = await page.$('.index_canvas_2n93K')
  await sleep(5000)

  // 删除页面dom 元素
  await page.evaluate(() => {
    const filterDom = document.querySelector('.index_globalFilters_2eHJm')
    const exitbtnDom = document.querySelector('.index_exitFullscreen_oBMlN')
    // 删除过滤dom
    filterDom.parentNode.removeChild(filterDom);
    // 删除退出全屏按钮
    exitbtnDom.parentNode.removeChild(exitbtnDom);
  })


  if (fileType === 'image') {
    await body.screenshot({
      path: filePath, clip: {
        x: 0,
        y: 0,
        width: dimensions.width,
        height: dimensions.height
      }
    });
  } else {
    await page.pdf({ path: filePath, width: dimensions.width, height: dimensions.height });
  }

  await browser.close();
  //process.stdout.write(imgStream);
  console.log('success')
  process.exit(0);
}

(async () => {
  try {
    await screenshot()
  } catch (error) {
    console.log('error',error)
    // 终止当前进程并返回给定的 code
    process.exit(1);
  }
})()


