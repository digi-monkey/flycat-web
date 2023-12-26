export type DropdownMenuItemType = {
  type: 'item';
  icon?: string;
  label: string;
  value: string;
  disabled?: boolean;
  [key: string]: any;
};

export type DropdownMenuGroupType = {
  type: 'group';
  label: string;
  children: DropdownMenuItemType[];
};

export type DropdownMenuDividerType = {
  type: 'divider';
};

export type DropdownMenuItem =
  | DropdownMenuItemType
  | DropdownMenuGroupType
  | DropdownMenuDividerType;
