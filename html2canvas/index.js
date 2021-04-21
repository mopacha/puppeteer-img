
import { html2img } from './html2pdf';

const pdfDom = document.getElementById('pdfDom');
const downloadPdf = () => {
    html2img('报表', pdfDom);
};


<div>
    <div className={styles.detail}>
        <Button onClick={downloadPdf}>下载PDF</Button>
    </div>


    <div id='pdfDom'>
        <Canvas editable={false} />
    </div>
</div>
