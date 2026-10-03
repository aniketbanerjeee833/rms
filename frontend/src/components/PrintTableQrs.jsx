import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

const CUSTOMER_BASE_URL =
    import.meta.env.VITE_CUSTOMER_URL || window.location.origin;

export const getTableQrUrl = (table) =>
    `${CUSTOMER_BASE_URL}/t/${table.Qr_Slug}`;

export function printTableQrs(tables) {
    const pages = tables
        .filter((t) => t.Qr_Slug)
        .map((t) => {
            const svg = renderToStaticMarkup(
                <QRCodeSVG
                    value={getTableQrUrl(t)}
                    size={320}
                    level="H"
                />
            );

            return `
                <div class="page">
                    <h1>${t.Table_Name}</h1>
                    ${svg}
                    <p>Scan to view menu &amp; order</p>
                </div>
            `;
        })
        .join("");

    const w = window.open(
        "",
        "_blank",
        "width=800,height=900"
    );

    if (!w) {
        alert("Please allow pop-ups to print QR codes.");
        return;
    }

    w.document.write(`
        <html>
            <head>
                <title>Table QR</title>

                <style>
                    @page {
                        size: A5;
                        margin: 10mm;
                    }

                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                    }

                    .page {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        page-break-after: always;
                        text-align: center;
                    }

                    .page:last-child {
                        page-break-after: auto;
                    }

                    h1 {
                        font-size: 40px;
                        margin: 0 0 16px;
                    }

                    p {
                        font-size: 20px;
                        margin-top: 12px;
                    }

                    svg {
                        width: 320px;
                        height: 320px;
                    }
                </style>
            </head>

            <body>
                ${pages}
            </body>
        </html>
    `);

    w.document.close();
    w.focus();

    setTimeout(() => {
        w.print();
        w.close();
    }, 400);
}

// ALSO provide a default export
export default printTableQrs;