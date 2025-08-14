import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleSignupPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSignupPopup = ({ isOpen, onClose }: GoogleSignupPopupProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
      <div className="fixed top-4 right-4 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sign up for Viraltify</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="text-sm text-gray-600 text-center">
            Choose an account to continue to Viraltify
          </div>
          
          <Button
            className="w-full flex items-center justify-start gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-12"
            onClick={() => {
              // Handle Google signup
              window.location.href = "/auth?mode=signup";
            }}
          >
            <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center border">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">Continue with Google</div>
              <div className="text-xs text-gray-500">Sign up instantly</div>
            </div>
          </Button>
          
          <div className="text-xs text-gray-500 text-center px-2">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
};