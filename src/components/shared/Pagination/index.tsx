import { FaChevronRight } from 'react-icons/fa';
import { FaAnglesLeft, FaAnglesRight, FaChevronLeft } from 'react-icons/fa6';
import { Button } from '../ui/Button';

export type PaginationProps = {
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
};

export function Pagination(props: PaginationProps) {
  return (
    <div className="flex items-center justify-end px-2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="hidden sm:flex w-[100px] items-center justify-center text-sm font-medium">
          Page {props.pageIndex} of {props.pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="link"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => props.onPageChange(1)}
            disabled={props.pageIndex === 1}
          >
            <span className="sr-only">Go to first page</span>
            <FaAnglesLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="link"
            className="h-8 w-8 p-0"
            onClick={() => props.onPageChange(props.pageIndex - 1)}
            disabled={props.pageIndex === 1}
          >
            <span className="sr-only">Go to previous page</span>
            <FaChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="link"
            className="h-8 w-8 p-0"
            onClick={() => props.onPageChange(props.pageIndex + 1)}
            disabled={props.pageIndex === props.pageCount}
          >
            <span className="sr-only">Go to next page</span>
            <FaChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="link"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => props.onPageChange(props.pageCount)}
            disabled={props.pageIndex === props.pageCount}
          >
            <span className="sr-only">Go to last page</span>
            <FaAnglesRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
