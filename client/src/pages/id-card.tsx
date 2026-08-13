import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Download, IdCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { IdCard as ResponsiveIdCard } from "@/components/id-card";
import { IdCardPdf } from "@/components/id-card-pdf";
import { memberId } from "@/components/id-card-data";

export function IdCardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const visibleQrRef = useRef<HTMLCanvasElement>(null);
  const pdfQrRef = useRef<HTMLCanvasElement>(null);
  const pdfCardRef = useRef<HTMLDivElement>(null);
  const qrRenderRef = useRef<Promise<void>>(Promise.resolve());
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!user || !visibleQrRef.current || !pdfQrRef.current) return;

    qrRenderRef.current = Promise.all([
      QRCode.toCanvas(visibleQrRef.current, `msrf-member:${user.id}`, {
        width: 180,
        margin: 1,
        color: { dark: "#3b1608", light: "#ffffff" },
      }),
      QRCode.toCanvas(pdfQrRef.current, `msrf-member:${user.id}`, {
        width: 180,
        margin: 1,
        color: { dark: "#3b1608", light: "#ffffff" },
      }),
    ]).then(() => undefined);
  }, [user]);

  if (!user) return null;
  const userId = user.id;

  async function downloadPdf() {
    setIsDownloading(true);
    try {
      const pdfCard = pdfCardRef.current;
      if (!pdfCard) throw new Error("PDF ID card is not ready.");

      await qrRenderRef.current;
      const snapshot = await html2canvas(pdfCard, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        logging: false,
        onclone: (clonedDocument) => {
          // The PDF card uses fixed inline styles. Remove generated stylesheets
          // so html2canvas does not need to parse unsupported color functions.
          clonedDocument
            .querySelectorAll("style, link[rel='stylesheet']")
            .forEach((styleSheet) => {
              styleSheet.remove();
            });
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 14;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const aspectRatio = snapshot.height / snapshot.width;
      let imageWidth = maxWidth;
      let imageHeight = imageWidth * aspectRatio;

      if (imageHeight > maxHeight) {
        imageHeight = maxHeight;
        imageWidth = imageHeight / aspectRatio;
      }

      pdf.addImage(
        snapshot.toDataURL("image/png"),
        "PNG",
        (pageWidth - imageWidth) / 2,
        (pageHeight - imageHeight) / 2,
        imageWidth,
        imageHeight,
        undefined,
        "FAST",
      );
      pdf.save(`MSRF-member-card-${userId}.pdf`);
    } catch (error) {
      console.error("Unable to download ID card PDF.", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "The ID card could not be prepared. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
      <div className=" flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs flex gap-1 items-center font-medium uppercase tracking-wider text-primary">
            <IdCard className="mt-1 h-5 w-5 text-primary" />
            <span className="ml-1 mt-0.5"> Membership</span>
          </p>
          <h2 className="mt-1 font-serif text-2xl font-bold">ID card</h2>
        </div>
        <div className="flex-col items-end justify-end gap-2">
          <div className="mt-5 flex justify-center">
            <Button
              type="button"
              onClick={() => void downloadPdf()}
              disabled={isDownloading}
              className="cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              {isDownloading ? "Preparing PDF…" : "Download ID Card"}
            </Button>
          </div>
        </div>
      </div>

      <ResponsiveIdCard user={user} qrRef={visibleQrRef} />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          width: "720px",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <IdCardPdf ref={pdfCardRef} user={user} qrRef={pdfQrRef} />
      </div>
    </section>
  );
}
