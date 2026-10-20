import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import { getTableMenuUrl } from "../../tables/utils/tableLinks";
import type { Table } from "../../tables/types/table.types";

interface TableQrModalProps {
  table: Table;
  onClose: () => void;
}

const QR_SIZE = 320;

export const TableQrModal = ({ table, onClose }: TableQrModalProps) => {
  const qrWrapperRef = useRef<HTMLDivElement>(null);
  const url = getTableMenuUrl(table._id);

  // 1️⃣ Copy the raw link (handy for testing the flow without a phone)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  // 2️⃣ Download a print-ready PNG: the QR on a white card with the table
  // number underneath, so the staff can print it and stick it on the right
  // table without having to label it by hand.
  const handleDownload = () => {
    const qrCanvas = qrWrapperRef.current?.querySelector("canvas");
    if (!qrCanvas) return;

    const padding = 40;
    const labelHeight = 72;

    const output = document.createElement("canvas");
    output.width = qrCanvas.width + padding * 2;
    output.height = qrCanvas.height + padding * 2 + labelHeight;

    const context = output.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, output.width, output.height);
    context.drawImage(qrCanvas, padding, padding);

    context.fillStyle = "#2b211b";
    context.textAlign = "center";
    context.font = "bold 32px sans-serif";
    context.fillText(
      `Table ${table.tableNo}`,
      output.width / 2,
      qrCanvas.height + padding + 50,
    );

    const link = document.createElement("a");
    link.download = `table-${table.tableNo}-qr.png`;
    link.href = output.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-brand-charcoal">
          Table {table.tableNo}
        </h2>
        <p className="text-xs text-brand-charcoal/50 mb-4">
          Customers scan this to open the menu and order straight to this table.
        </p>

        {/* The white card keeps the code scannable even on the cream page */}
        <div
          ref={qrWrapperRef}
          className="flex justify-center bg-white rounded-2xl border border-brand-peach p-4"
        >
          <QRCodeCanvas
            value={url}
            size={QR_SIZE}
            style={{ width: "100%", maxWidth: QR_SIZE, height: "auto" }}
          />
        </div>

        <p className="text-[11px] text-brand-charcoal/40 mt-3 break-all">
          {url}
        </p>

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-lg border border-brand-peach text-brand-charcoal font-medium transition cursor-pointer"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-2.5 rounded-lg bg-brand-orange hover:bg-brand-orange-dark text-white font-medium transition cursor-pointer"
          >
            Download PNG
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-2.5 text-sm text-brand-charcoal/60 hover:text-brand-charcoal transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
