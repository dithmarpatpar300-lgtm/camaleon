"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UsePageFileDropOptions = {
  enabled: boolean;
  onFile: (file: File) => void;
  acceptExtensions: string[];
};

export function usePageFileDrop({
  enabled,
  onFile,
  acceptExtensions,
}: UsePageFileDropOptions) {
  const counterRef = useRef(0);
  const [active, setActive] = useState(false);
  const enabledRef = useRef(enabled);
  const onFileRef = useRef(onFile);
  const acceptRef = useRef(acceptExtensions);

  enabledRef.current = enabled;
  onFileRef.current = onFile;
  acceptRef.current = acceptExtensions;

  useEffect(() => {
    if (!enabled) {
      counterRef.current = 0;
      setActive(false);
    }
  }, [enabled]);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (!enabledRef.current) return;
      if (e.dataTransfer?.types.includes("Files")) {
        counterRef.current++;
        setActive(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      counterRef.current--;
      if (counterRef.current <= 0) {
        counterRef.current = 0;
        setActive(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      counterRef.current = 0;
      setActive(false);
      if (!enabledRef.current) return;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (acceptRef.current.includes(ext)) {
          onFileRef.current(file);
        }
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  return { active };
}
