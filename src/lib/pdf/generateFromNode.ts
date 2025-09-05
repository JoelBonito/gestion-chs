export async function generatePdfFromNode(el: HTMLElement, fileName: string) {
  const { jsPDF } = await import('jspdf');
  const html2canvas = (await import('html2canvas')).default;
  
  const start = performance.now();
  console.log('[OrderPDF] start');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
  });
  
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  let heightLeft = imgHeight;
  let position = 0;
  
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;
  
  while (heightLeft > 0) {
    pdf.addPage();
    position = -(imgHeight - heightLeft);
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }
  
  const blob = pdf.output('blob');
  console.log('[OrderPDF] sizeKB:', Math.round(blob.size / 1024));
  pdf.save(fileName);
  console.log('[OrderPDF] done ms:', Math.round(performance.now() - start));
}