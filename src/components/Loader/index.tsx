import { SmallLoaderUI } from './small-ui';
import { LoaderUI } from './ui';

export interface LoaderProp {
  isLoading: boolean;
}

export const Loader: React.FC<LoaderProp> = ({ isLoading }) => {
  return (
    <>
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LoaderUI />
        </div>
      )}
    </>
  );
};

export const SmallLoader: React.FC<LoaderProp> = ({ isLoading }) => {
  return <>{isLoading && <SmallLoaderUI />}</>;
};
