import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { X } from "lucide-react";

export default function SimpleModal({ open, onClose, children, title, icon }) {
  const modalRef = useRef(null);
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <Card ref={modalRef} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()} style={{ zIndex: 20000 }}>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && <div className="p-2 bg-white bg-opacity-20 rounded-lg">{icon}</div>}
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, { modalContainer: modalRef.current })
              : child
          )}
        </CardContent>
      </Card>
    </div>
  );
} 