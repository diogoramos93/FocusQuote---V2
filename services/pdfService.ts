
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quote, PhotographerProfile, Client } from '../types';

export const generateQuotePDF = async (quote: Quote, profile: PhotographerProfile, client: Client) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const primaryColor = [79, 70, 229]; // Indigo-600 (#4f46e5)
  const darkColor = [30, 41, 59]; // Slate-800 (#1e293b)
  const mutedColor = [71, 85, 105]; // Slate-600 (#475569)
  const lightGray = [248, 250, 252]; // Slate-50 (#f8fafc)
  const borderColor = [226, 232, 240]; // Slate-200 (#e2e8f0)

  const fmt = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const startX = 20;
  const rightX = 190;
  let currentY = 25;

  // --- CABEÇALHO ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(profile.studioName || profile.name, startX, currentY);
  
  // Info Fotógrafo
  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.setFont('helvetica', 'normal');
  currentY += 8;
  doc.text(profile.name, startX, currentY);
  currentY += 5;
  doc.text(`CNPJ/CPF: ${profile.taxId}`, startX, currentY);
  currentY += 5;
  doc.text(profile.address, startX, currentY);
  currentY += 5;
  doc.text(profile.phone, startX, currentY);

  // Título e Orçamento (Direita)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('ORÇAMENTO', rightX, 25, { align: 'right' });
  
  doc.setFontSize(11);
  doc.text(`#${quote.number}`, rightX, 32, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`Emissão: ${new Date(quote.date).toLocaleDateString('pt-BR')}`, rightX, 40, { align: 'right' });
  doc.text(`Vencimento: ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}`, rightX, 45, { align: 'right' });

  // Linha divisória
  currentY = 55;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(startX, currentY, rightX, currentY);

  // --- CLIENTE E STATUS ---
  currentY += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('CLIENTE', startX, currentY);
  doc.text('STATUS', rightX, currentY, { align: 'right' });

  currentY += 8;
  doc.setFontSize(13);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(client.name, startX, currentY);
  
  // Badge Status
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.roundedRect(165, currentY - 5, 25, 7, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(quote.status.toUpperCase(), 177.5, currentY, { align: 'center' });

  currentY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(`CPF/CNPJ: ${client.taxId || '---'}`, startX, currentY);
  currentY += 5;
  doc.text(`E-mail: ${client.email}`, startX, currentY);
  currentY += 5;
  doc.text(client.address, startX, currentY);

  // --- TABELA DE ITENS ---
  currentY += 12;
  const tableData = quote.items.map(item => [
    item.name,
    `${item.quantity} ${item.type}`,
    fmt(item.unitPrice),
    fmt(item.unitPrice * item.quantity)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Serviço', 'Qtd', 'Unitário', 'Total']],
    body: tableData,
    theme: 'plain',
    headStyles: { 
      fillColor: lightGray as any,
      textColor: mutedColor as any, 
      fontSize: 8, 
      fontStyle: 'bold',
      cellPadding: 4
    },
    styles: { 
      fontSize: 9, 
      textColor: darkColor as any,
      cellPadding: 4,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: startX, right: 20 },
    didDrawPage: (data) => {
      currentY = data.cursor?.y || currentY;
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- TOTAIS ---
  if (currentY > 230) { doc.addPage(); currentY = 25; }

  doc.setFontSize(9);
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('Subtotal', 140, currentY);
  doc.text(fmt(quote.total + (quote.discount || 0)), rightX, currentY, { align: 'right' });

  currentY += 12;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Total Final', 130, currentY);
  doc.text(fmt(quote.total), rightX, currentY, { align: 'right' });

  // --- PAGAMENTO ---
  currentY += 25;
  if (currentY > 250) { doc.addPage(); currentY = 25; }
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PAGAMENTO', startX, currentY);

  currentY += 4;
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(startX, currentY, 170, 18, 2, 2, 'FD');
  
  currentY += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Método: ${quote.paymentMethod}`, startX + 5, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text(quote.paymentConditions, startX + 5, currentY);

  // --- ASSINATURA ---
  currentY = 275; 
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(startX, currentY, 80, currentY);
  
  currentY += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(profile.name, startX, currentY);
  
  currentY += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
  doc.text('ASSINATURA', startX, currentY);

  doc.save(`Orcamento_${quote.number}_${client.name.replace(/\s+/g, '_')}.pdf`);
};
