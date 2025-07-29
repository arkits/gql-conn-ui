import { useState } from "react";
import { IconButton, Tooltip } from "@chakra-ui/react";
import { Clipboard as ClipboardIcon, Check } from "lucide-react";

interface ClipboardProps {
  textToCopy: string;
  darkMode: boolean;
}

export const Clipboard = ({ textToCopy, darkMode }: ClipboardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Tooltip label={copied ? "Copied!" : "Copy to clipboard"} placement="top">
      <IconButton
        aria-label="Copy to clipboard"
        onClick={handleCopy}
        variant="ghost"
        size="sm"
        color={copied ? "green.400" : darkMode ? "gray.400" : "gray.600"}
        _hover={{ bg: darkMode ? "gray.700" : "gray.200" }}
      >
        {copied ? <Check size={16} /> : <ClipboardIcon size={16} />}
      </IconButton>
    </Tooltip>
  );
};
