"use client";

import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  ListOrdered,
  Code,
  List,
  MessageSquareCode,
  Sigma,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" className="font-bold">
              B
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Bold</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" className="italic">
              I
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Italic</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" className="underline">
              U
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Underline</TooltipContent>
        </Tooltip>
      </ButtonGroup>

      {/* Heading Button Group Is empty*/}
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              H
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Heading</TooltipContent>
        </Tooltip>
      </ButtonGroup>

      {/* Ordered and Unordered List group*/}
      <ButtonGroup>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              <List />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Unordered List</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              <ListOrdered />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Ordered List</TooltipContent>
        </Tooltip>
      </ButtonGroup>

      <ButtonGroup>
        {/* Math */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              <Sigma />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Math</TooltipContent>
        </Tooltip>
        {/* Inline code */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              <Code />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Code Blocks</TooltipContent>
        </Tooltip>
        {/* Mention */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              @
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Symbols</TooltipContent>
        </Tooltip>
        {/* Comment */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline">
              <MessageSquareCode />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Comments</TooltipContent>
        </Tooltip>
      </ButtonGroup>

      {/* Right side spacer so zoom/actions stay aligned */}
      <div className="flex-1" />
    </div>
  );
}
