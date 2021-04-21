import moment from 'moment';
import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

export const html2img = (name, dom) => {
  html2canvas(dom, {
    backgroundColor: 'white',
    useCORS: true, // 支持图片跨域
    scale: 2, // 设置放大的倍数
    height: dom.offsetHeight * 2,
    width: dom.offsetWidth
  }).then((canvas) => {
    // 修改生成的宽度
    // canvas.style.width = "1000px";
    console.log(canvas, '生成的画布文件');

    const filename = `${name}_${moment(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss')}.png`;
    const canvasImg = canvas.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    const event = new MouseEvent('click'); // 创建一个单击事件
    a.download = filename || 'photo';
    a.href = canvasImg;
    a.dispatchEvent(event); // 触发a的单击事件
  });
};
