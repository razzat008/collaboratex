"use client";

import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FormattingToolbar() {
  return (
    <div className="w-full h-10 border-b bg-gray-200 px-2 flex items-center gap-2">
      {/* Font group */}
      <Button size="sm" variant="outline">
        Ag
      </Button>

      {/* Text style group */}
      <div className="flex items-center border rounded-md overflow-hidden">
        <Button size="sm" variant="ghost" className="font-bold">
          B
        </Button>
        <Separator orientation="vertical" />
        <Button size="sm" variant="ghost" className="italic">
          I
        </Button>
        <Separator orientation="vertical" />
        <Button size="sm" variant="ghost" className="underline">
          U
        </Button>
      </div>

      {/* Heading */}
      <Button size="sm" variant="outline">
        H
      </Button>

      {/* List group */}
      <div className="flex items-center border rounded-md overflow-hidden">
        <Button size="sm" variant="ghost">
          •
        </Button>
        <Separator orientation="vertical" />
        <Button size="sm" variant="ghost">
          1.
        </Button>
      </div>

      {/* Math */}
      <Button size="sm" variant="outline">
        ∑
      </Button>

      {/* Inline code */}
      <Button size="sm" variant="outline">{`</>`}</Button>

      {/* Mention */}
      <Button size="sm" variant="outline">
        @
      </Button>

      {/* Comment */}
      <Button size="sm" variant="outline">
        💬
      </Button>

      {/* Right side spacer so zoom/actions stay aligned */}
      <div className="flex-1" />
    </div>
  );
}
