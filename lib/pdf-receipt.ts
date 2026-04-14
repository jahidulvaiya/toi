import { jsPDF } from "jspdf";
import type { Invoice, Property } from "@/types";

interface ReceiptData {
  invoice: Invoice;
  property?: Property;
  ownerName?: string;
  ownerPhone?: string;
}

export function generateReceiptPDF(data: ReceiptData): jsPDF {
  const { invoice, property, ownerName, ownerPhone } = data;
  const doc = new jsPDF();

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const grayColor: [number, number, number] = [107, 114, 128];
  const darkColor: [number, number, number] = [17, 24, 39];
  const successColor: [number, number, number] = [34, 197, 94];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("PropManager - Property Management System", 105, 30, { align: "center" });

  // Receipt Info Box
  doc.setTextColor(...darkColor);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(15, 50, 180, 25, 3, 3, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Receipt No:", 20, 58);
  doc.text("Date:", 20, 68);
  doc.text("Month:", 100, 58);
  doc.text("Status:", 100, 68);

  doc.setFont("helvetica", "normal");
  doc.text(`#${invoice.id.slice(-8).toUpperCase()}`, 50, 58);
  doc.text(
    invoice.paymentDate?.toDate?.()
      ? new Date(invoice.paymentDate.toDate()).toLocaleDateString("en-BD", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-BD", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
    50,
    68
  );
  doc.text(formatMonth(invoice.month), 130, 58);
  
  // Status with color
  if (invoice.status === "paid") {
    doc.setTextColor(...successColor);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", 130, 68);
  } else {
    doc.setTextColor(239, 68, 68);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.status.toUpperCase(), 130, 68);
  }

  // Tenant & Property Info
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Tenant Information", 15, 90);

  doc.setDrawColor(229, 231, 235);
  doc.line(15, 93, 195, 93);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${invoice.tenantName}`, 15, 102);
  doc.text(`Unit: ${invoice.unitNumber}`, 15, 110);
  doc.text(`Property: ${property?.name || "N/A"}`, 15, 118);
  doc.text(`Address: ${property?.address || "N/A"}`, 15, 126);

  // Payment Details Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", 15, 145);
  doc.line(15, 148, 195, 148);

  // Table Header
  doc.setFillColor(249, 250, 251);
  doc.rect(15, 152, 180, 10, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 20, 159);
  doc.text("Amount (BDT)", 165, 159, { align: "right" });

  // Table Body
  doc.setFont("helvetica", "normal");
  let y = 170;

  const items = [
    { label: "Monthly Rent", amount: invoice.rent },
    { label: "Gas Charge", amount: invoice.gasCharge },
    { label: "Water Charge", amount: invoice.waterCharge },
    { label: "Service Charge", amount: invoice.serviceCharge },
  ];

  items.forEach((item) => {
    if (item.amount > 0) {
      doc.text(item.label, 20, y);
      doc.text(`${item.amount.toLocaleString("en-BD")}`, 165, y, { align: "right" });
      y += 8;
    }
  });

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.line(15, y + 2, 195, y + 2);
  y += 10;

  // Total
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 20, y);
  doc.text(`BDT ${invoice.totalAmount.toLocaleString("en-BD")}`, 165, y, { align: "right" });
  y += 10;

  // Paid Amount
  doc.setTextColor(...successColor);
  doc.text("Paid Amount:", 20, y);
  doc.text(`BDT ${invoice.paidAmount.toLocaleString("en-BD")}`, 165, y, { align: "right" });
  y += 10;

  // Due Amount
  if (invoice.dueAmount > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text("Due Amount:", 20, y);
    doc.text(`BDT ${invoice.dueAmount.toLocaleString("en-BD")}`, 165, y, { align: "right" });
    y += 10;
  }

  // Payment Confirmation Box (if paid)
  if (invoice.status === "paid") {
    y += 10;
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(15, y, 180, 25, 3, 3, "F");

    doc.setTextColor(...successColor);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT CONFIRMED", 105, y + 10, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your payment!", 105, y + 18, { align: "center" });
  }

  // Footer
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const footerY = 270;
  doc.line(15, footerY - 5, 195, footerY - 5);

  if (ownerName || ownerPhone) {
    doc.text(`Issued by: ${ownerName || "Property Owner"}`, 15, footerY);
    if (ownerPhone) {
      doc.text(`Contact: ${ownerPhone}`, 15, footerY + 6);
    }
  }

  doc.text("Generated by PropManager", 195, footerY, { align: "right" });
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-BD")}`, 195, footerY + 6, {
    align: "right",
  });

  return doc;
}

export function downloadReceiptPDF(data: ReceiptData, filename?: string) {
  const doc = generateReceiptPDF(data);
  const defaultFilename = `receipt-${data.invoice.tenantName.replace(/\s+/g, "-")}-${data.invoice.month}.pdf`;
  doc.save(filename || defaultFilename);
}

export function getReceiptPDFBlob(data: ReceiptData): Blob {
  const doc = generateReceiptPDF(data);
  return doc.output("blob");
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-BD", { year: "numeric", month: "long" });
}
