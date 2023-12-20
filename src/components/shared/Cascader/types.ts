export interface Option {
  value: string;
  label?: React.ReactNode;
  disabled?: boolean;
  children?: Option[];
  group?: string;
}
