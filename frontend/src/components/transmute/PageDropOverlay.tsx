import { useI18n } from "@/providers/I18nProvider";

type PageDropOverlayProps = {
  active: boolean;
};

export function PageDropOverlay({ active }: PageDropOverlayProps) {
  const { t } = useI18n();

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base/80 backdrop-blur-sm"
      aria-hidden="false"
    >
      <div className="flex h-[60vh] w-[80vw] items-center justify-center rounded-3xl border-2 border-dashed border-accent bg-accent-subtle">
        <p className="text-lg font-medium text-accent">
          {t("dropzone.pageOverlayLabel")}
        </p>
      </div>
    </div>
  );
}
