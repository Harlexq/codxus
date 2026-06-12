import { FC } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

interface Props {
  required?: boolean;
}

const FieldRequired: FC<Props> = ({ required = true }) => {
  if (required)
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="text-red-500">*</span>
        </TooltipTrigger>
        <TooltipContent>Bu alanları doldurmak zorunludur.</TooltipContent>
      </Tooltip>
    );

  return <span className="text-muted-foreground text-xs">(İsteğe Bağlı)</span>;
};

export default FieldRequired;
