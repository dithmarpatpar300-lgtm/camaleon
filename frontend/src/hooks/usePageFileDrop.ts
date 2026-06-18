"use client";

import { useEffect, useRef, useState } from "react";

type UsePageFileDropOptions = {
  enabled: boolean;
  onFiles: (files: File[]) => void;
  acceptExtensions: string[];
};

export function usePageFileDrop({
  enabled,
  onFiles,
  acceptExtensions,
}: UsePageFileDropOptions) {
  const counterRef = useRef(0);
  const [active, setActive] = useState(false);
  const enabledRef = useRef(enabled);
  const onFilesRef = useRef(onFiles);
  const acceptRef = useRef(acceptExtensions);

  enabledRef.current = enabled;
  onFilesRef.current = onFiles;
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

      const fileList = e.dataTransfer?.files;
      if (!fileList || fileList.length === 0) return;
      onFilesRef.current(Array.from(fileList));
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
