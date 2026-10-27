"use client";
import Image from "next/image";
import { useState } from "react";
import { assetUrl } from "@/lib/api/client";
import { getInitials } from "@/lib/utils";
export function Avatar({
  name,
  photo,
}: {
  name: string;
  photo?: string | null;
}) {
  const url = assetUrl(photo);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <span className="user-avatar">
      {url && url !== failedUrl ? (
        <Image
          src={url}
          alt=""
          width={60}
          height={60}
          unoptimized
          onError={() => setFailedUrl(url)}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
