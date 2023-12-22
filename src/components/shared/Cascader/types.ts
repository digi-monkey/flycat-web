export interface ICascaderOption {
  value: string;
  label?: React.ReactNode;
  disabled?: boolean;
  children?: ICascaderOption[];
  group?: string;
}
