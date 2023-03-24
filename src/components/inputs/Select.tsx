import React, { useEffect, useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

const SimpleSelect = ({
  options,
  callBack,
  defaultOption = '',
}) => {
  const [value, setValue] = useState<string>(defaultOption);

  const handleChange = (event: SelectChangeEvent<string>) => setValue(event.target.value);

  useEffect(() => callBack(value), [value]);

  return (
    <FormControl>
      <Select
        labelId="simple-select-label"
        id="simple-select"
        value={value}
        onChange={handleChange}
        variant={'standard'}
      >
        {options.map((option: any) => (
          <MenuItem key={option.toString()} value={option.toString()}>
            {option.toString()}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SimpleSelect;
