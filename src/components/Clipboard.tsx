import { useState } from "react";
import { IconButton } from "@chakra-ui/react";
import { Clipboard as ClipboardIcon, Check } from "lucide-react";

interface ClipboardProps {
  textToCopy: string;
  darkMode: boolean;
}

export const Clipboard = ({ textToCopy, darkMode }: ClipboardProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <IconButton
      aria-label={hasCopied ? "Copied!" : "Copy to clipboard"}
      onClick={onCopy}
      variant="ghost"
      size="sm"
      color={hasCopied ? "green.400" : darkMode ? "gray.400" : "gray.600"}
      _hover={{ bg: darkMode ? "gray.700" : "gray.200" }}
    >
      {hasCopied ? <Check size={16} /> : <ClipboardIcon size={16} />}
    </IconButton>
  );
};
