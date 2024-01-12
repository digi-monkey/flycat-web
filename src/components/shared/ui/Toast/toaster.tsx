import { useCallback } from 'react';
import {
  FaCircleInfo,
  FaCircleCheck,
  FaCircleXmark,
  FaSpinner,
} from 'react-icons/fa6';
import { cn } from 'utils/classnames';
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from '.';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();

  const renderIcon = useCallback((level: string) => {
    let sign = <FaCircleInfo className="w-4 h-4 text-functional-info" />;
    switch (level) {
      case 'info':
        sign = <FaCircleInfo className="w-4 h-4 text-functional-info" />;
        break;
      case 'loading':
        sign = (
          <FaSpinner className="w-4 h-4 text-functional-info animate-spin" />
        );
        break;
      case 'success':
        sign = <FaCircleCheck className="w-4 h-4 text-functional-success" />;
        break;
      case 'warning':
        sign = <FaCircleInfo className="w-4 h-4 text-functional-warning" />;
        break;
      case 'error':
        sign = <FaCircleXmark className="w-4 h-4 text-functional-danger" />;
        break;
      default:
        break;
    }
    return sign;
  }, []);

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        closeable,
        type: level = 'info',
        ...props
      }) {
        return (
          <Toast
            key={id}
            {...props}
            className={cn(props.className, {
              'pr-4': !closeable,
            })}
          >
            <div className="grid gap-1">
              <div className="flex gap-3">
                <div className="pt-1.5">{renderIcon(level)}</div>
                <ToastTitle className="flex-1 flex items-center">
                  {title}
                </ToastTitle>
              </div>
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            {closeable && <ToastClose />}
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
