'use client';

import * as React from 'react';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/src/components/modals/modal';
import { Button } from '@/src/components/ui/button';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'destructive',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <ModalHeader className="flex flex-col items-center sm:items-start text-center sm:text-left pt-4">
          <div className={`h-12 w-12 rounded-full mb-4 flex items-center justify-center ${variant === 'destructive' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {variant === 'destructive' ? <Trash2 className="size-6" /> : <AlertCircle className="size-6" />}
          </div>
          <ModalTitle className="text-2xl">{title}</ModalTitle>
          <ModalDescription className="mt-2 text-base">
            {description}
          </ModalDescription>
        </ModalHeader>
        <ModalFooter className="mt-6 gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl">
            {cancelLabel}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm} 
            disabled={isLoading}
            className="rounded-xl shadow-lg shadow-destructive/20 px-8"
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
