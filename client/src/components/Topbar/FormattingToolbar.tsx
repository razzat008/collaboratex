"use client";

import { Button } from "../ui/button";
import {
  ListOrdered,
  Code,
  List,
  MessageSquareCode,
  Sigma,
} from "lucide-react";
import { ButtonGroup } from "../ui/button-group";

export default function FormattingToolbar() {
  return (
    <div className="w-full h-10 border-b bg-gray-200 px-2 flex items-center gap-2">
      {/* Font group */}
      <Button size="sm" variant="outline">
        Ag
      </Button>

      {/* Button Group for Bold, Italics and Underline */}
      <ButtonGroup>
        <Button size="sm" variant="outline" className="font-bold" title="Bold">
          B
        </Button>

        <Button size="sm" variant="outline" className="italic" title="Italic">
          I
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="underline"
          title="Underline"
        >
          U
        </Button>
      </ButtonGroup>

      {/* Heading Button Group Is empty*/}
      <ButtonGroup>
        <Button size="sm" variant="outline" title="Heading">
          H
        </Button>
      </ButtonGroup>

      {/* Ordered and Unordered List group*/}
      <ButtonGroup>
        <Button size="sm" variant="outline" title="List">
          <List />
        </Button>
        <Button size="sm" variant="outline" title="Ordered List">
          <ListOrdered />
        </Button>
      </ButtonGroup>

      <ButtonGroup>
        {/* Math */}
        <Button size="sm" variant="outline" title="Math">
          <Sigma />
        </Button>
        {/* Inline code */}
        <Button size="sm" variant="outline" title="Inline Code">
          <Code />
        </Button>
        {/* Symbols */}
        <Button size="sm" variant="outline" title="Symbols">
          @
        </Button>
        {/* Comment */}
        <Button size="sm" variant="outline" title="Comment">
          <MessageSquareCode />
        </Button>
      </ButtonGroup>

      {/* Right side spacer so zoom/actions stay aligned */}
      <div className="flex-1" />
    </div>
  );
}
