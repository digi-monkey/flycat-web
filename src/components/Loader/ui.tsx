import './index.module.scss';
// Source: https://loading.io/css/

export const LoaderUI = () => {
  return (
    <div className="lds-ellipsis">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};
