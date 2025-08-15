import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveSearchProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  loading?: boolean;
  buttonText: string;
  buttonIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export const ResponsiveSearch = ({
  placeholder,
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  buttonText,
  buttonIcon,
  leftIcon,
  className,
  inputClassName,
  buttonClassName
}: ResponsiveSearchProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 w-full", className)}>
      <div className="relative flex-1">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          className={cn(
            "w-full text-base",
            leftIcon && "pl-10",
            inputClassName
          )}
        />
      </div>
      <Button
        onClick={onSubmit}
        disabled={disabled || loading || !value.trim()}
        className={cn(
          "w-full sm:w-auto whitespace-nowrap px-4 sm:px-6",
          "min-w-[120px] sm:min-w-[140px]",
          buttonClassName
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          buttonIcon && <span className="mr-2">{buttonIcon}</span>
        )}
        <span className="hidden sm:inline">{buttonText}</span>
        <span className="sm:hidden">
          {loading ? 'Searching...' : buttonText.split(' ')[0]}
        </span>
      </Button>
    </div>
  );
};