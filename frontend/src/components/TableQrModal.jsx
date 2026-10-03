import { QRCodeSVG } from "qrcode.react";
import { getTableQrUrl, printTableQrs } from "./PrintTableQrs";

export default function TableQrModal({ table, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[360px] text-center">
        <h4 className="text-xl font-bold mb-3">{table.Table_Name}</h4>

        {table.Qr_Slug ? (
          <>
            <div className="flex justify-center">
              <QRCodeSVG value={getTableQrUrl(table)} size={240} level="H" includeMargin />
            </div>
            <p className="text-xs text-gray-500 break-all mt-2">{getTableQrUrl(table)}</p>
          </>
        ) : (
          <p className="text-red-500">QR not generated for this table.</p>
        )}

        <div className="flex justify-center gap-3 mt-4">
          <button
            style={{ backgroundColor: "#ff0000", outline: "none", boxShadow: "none" }}
            className="text-white px-4 py-2 rounded-md"
            disabled={!table.Qr_Slug}
            onClick={() => printTableQrs([table])}
          >
            Print QR
          </button>
          <button className="px-4 py-2 rounded-md bg-gray-200" 
           style={{ backgroundColor: "lightgray", outline: "none", boxShadow: "none" }}
          onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}