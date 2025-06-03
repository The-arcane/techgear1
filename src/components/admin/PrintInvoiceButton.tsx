"use client";

import { Button } from "@/components/ui/button";

export function PrintInvoiceButton() {
  const handlePrintInvoice = () => {
    // In a real application, this would trigger a print dialog
    // or generate a PDF for printing.
    alert("Mock action: Printing invoice...");
  };

  return (
    <Button variant="secondary" onClick={handlePrintInvoice}>
      Print Invoice
    </Button>
  );
}
