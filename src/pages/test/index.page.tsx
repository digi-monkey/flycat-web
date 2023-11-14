import { testNotice } from 'components/PubEventNotice';

export const Test = () => {
  const onClick = () => {
    testNotice();
  };
  return (
    <div>
      <button onClick={onClick}>test</button>
    </div>
  );
};

export default Test;
